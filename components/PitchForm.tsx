"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import {
  MAIN_EMAIL,
  MAX_FILES,
  MAX_FILE_MB,
  type Pitch,
  type PitchErrors,
  checkPitch,
  formats,
  storyTypes,
  subjects,
  years,
} from "@/lib/pitch";
import { pitchMailto, pitchText } from "@/lib/pitchMailto";
import { type Progress, submitPitch } from "@/lib/sendPitch";
import styles from "./PitchForm.module.css";

const empty: Pitch = {
  name: "",
  email: "",
  program: "",
  year: "",
  type: "",
  typeOther: "",
  subject: "",
  subjectOther: "",
  formats: [],
  angle: "",
  why: "",
  files: [],
};

type Errors = PitchErrors;

function check(p: Pitch): Errors {
  const e = checkPitch(p);
  if (p.files.length > MAX_FILES) e.files = `Please attach at most ${MAX_FILES} files.`;
  else if (p.files.some((f) => f.size > MAX_FILE_MB * 1024 * 1024)) e.files = `Each file must be under ${MAX_FILE_MB}MB. Put a link to bigger ones in your pitch instead.`;
  return e;
}

/** One row: the form part on the left, the matching guide note on the right. */
function Row({ n, title, note, children }: { n: string; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.row} aria-labelledby={`step-${n}`}>
      <div className={styles.field}>
        <div className={styles.step}>
          <span className="label">{n} {"//"}</span>
          <h2 id={`step-${n}`}>{title}</h2>
        </div>
        {children}
      </div>
      {note && (
        <aside className={styles.note}>
          <p className="label">guide {"//"} {n}</p>
          {note}
        </aside>
      )}
    </section>
  );
}

/**
 * byEmail: real sending isn't set up yet, so the button opens the person's
 * email app with the pitch written out, addressed to the magazine inbox.
 */
export default function PitchForm({ byEmail = false }: { byEmail?: boolean }) {
  const [p, setP] = useState<Pitch>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  /** the email app was opened (byEmail), rather than the pitch sent */
  const [emailed, setEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);

  // after sending (or opening the email), bring the message into view, not just the top of the page
  useEffect(() => {
    if (sent || emailed) doneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sent, emailed]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [failure, setFailure] = useState("");
  /** a box hidden from people: only robots fill it in */
  const [website, setWebsite] = useState("");

  const set = <K extends keyof Pitch>(key: K, value: Pitch[K]) => {
    setP((old) => ({ ...old, [key]: value }));
    setErrors((old) => ({ ...old, [key]: undefined }));
  };

  const type = storyTypes.find((t) => t.id === p.type);
  const subject = subjects.find((s) => s.id === p.subject);
  const bigFiles = p.files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = check(p);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    if (byEmail) {
      // straight away, still inside the tap, or Safari on iPhone won't open it
      window.location.href = pitchMailto(p);
      setEmailed(true);
      setCopied(false);
      return;
    }
    setSending(true);
    setFailure("");
    const res = await submitPitch(p, website, setProgress);
    setSending(false);
    if (res.ok) {
      setSent(true);
      return;
    }
    setFailure(res.error);
    if (res.fields) {
      setErrors(res.fields);
      const firstBad = Object.keys(res.fields)[0];
      if (firstBad) document.getElementById(`f-${firstBad}`)?.focus();
    }
  };

  const err = (k: keyof Pitch) =>
    errors[k] ? (
      <p className={styles.error} id={`e-${k}`}>
        {errors[k]}
      </p>
    ) : null;
  const describedBy = (k: keyof Pitch) => (errors[k] ? `e-${k}` : undefined);

  const firstName = p.name.trim().split(/\s+/)[0];
  const anotherPitch = (
    <button
      type="button"
      className={styles.secondary}
      onClick={() => {
        setP(empty);
        setSent(false);
        setEmailed(false);
        setFailure("");
      }}
    >
      Pitch another story
    </button>
  );
  const specimen = (
    <div className={styles.specimen}>
      <p className="label">specimen // {p.type === "idea" ? p.typeOther : type?.name}</p>
      <p className={styles.specimenTitle}>{p.angle.slice(0, 120)}</p>
      <p className="label">
        subject: {p.subject === "other" ? p.subjectOther : subject?.label} &nbsp; format: {p.formats.join(", ").toLowerCase()}
      </p>
    </div>
  );

  if (emailed) {
    return (
      <div className={styles.sent} role="status" ref={doneRef}>
        <p className="label">almost there // {new Date().toLocaleDateString("en-CA")}</p>
        <h2>Your email is ready, {firstName}!</h2>
        <p>
          Your email app should have opened with your pitch written out, addressed to <strong>{MAIN_EMAIL}</strong>. Press
          Send there and it&apos;s on its way. We usually reply within a week.
        </p>
        {p.files.length > 0 && (
          <p className={styles.warning}>
            Attach your {p.files.length > 1 ? "files" : "file"} to that email before you send it:{" "}
            <strong>{p.files.map((f) => f.name).join(", ")}</strong>
          </p>
        )}
        {specimen}
        <p>
          Didn&apos;t open? Copy your pitch and email it to <a href={`mailto:${MAIN_EMAIL}`}>{MAIN_EMAIL}</a> yourself.
        </p>
        <div className={styles.sentButtons}>
          <button
            type="button"
            className={styles.secondary}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pitchText(p));
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied ✓" : "Copy my pitch"}
          </button>
          <a className={styles.secondary} href={pitchMailto(p)}>
            Open my email again
          </a>
          {anotherPitch}
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className={styles.sent} role="status" ref={doneRef}>
        <p className="label">transmission received // {new Date().toLocaleDateString("en-CA")}</p>
        <h2>Thank you, {firstName}!</h2>
        <p>
          Your pitch is with the editors. We usually reply within a week, at <strong>{p.email}</strong>.
        </p>
        {specimen}
        {anotherPitch}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.trap} aria-hidden="true">
        Leave this empty
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
      </label>
      <Row
        n="01"
        title="About you"
      >
        <div className={styles.grid2}>
          <label className={styles.label}>
            Name
            <input id="f-name" value={p.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={describedBy("name")} />
            {err("name")}
          </label>
          <label className={styles.label}>
            Email
            <input id="f-email" type="email" value={p.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />
            {err("email")}
          </label>
          <label className={styles.label}>
            Degree and program
            <input id="f-program" value={p.program} onChange={(e) => set("program", e.target.value)} placeholder="BSc, Biology" aria-invalid={!!errors.program} aria-describedby={describedBy("program")} />
            {err("program")}
          </label>
          <label className={styles.label}>
            Year
            <select id="f-year" value={p.year} onChange={(e) => set("year", e.target.value)} aria-invalid={!!errors.year} aria-describedby={describedBy("year")}>
              <option value="">Choose…</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            {err("year")}
          </label>
        </div>
      </Row>

      <Row
        n="02"
        title="Type of story"
        note={
          type ? (
            <>
              <p className={styles.noteTitle}>
                {type.name} <span className="label">{"//"} {type.length}</span>
              </p>
              <p>{type.description}</p>
              {type.example && (
                <Link href={`/issues/${type.example.issueId}?page=${type.example.page}`} className={styles.noteLink} target="_blank">
                  See an example: {type.example.title} ↗
                </Link>
              )}
            </>
          ) : (
            <p>Pick the kind closest to your idea, and you&apos;ll see what we look for in it here, with an example from a past issue.</p>
          )
        }
      >
        <div id="f-type" tabIndex={-1} className={styles.types} role="radiogroup" aria-label="Type of story" aria-describedby={describedBy("type")}>
          {storyTypes.map((t) => (
            <label key={t.id} className={`${styles.typeCard} ${p.type === t.id ? styles.picked : ""}`}>
              <input type="radio" name="type" value={t.id} checked={p.type === t.id} onChange={() => set("type", t.id)} />
              <span className={styles.typeName}>{t.name}</span>
              <span className="label">{t.length}</span>
            </label>
          ))}
        </div>
        {err("type")}
        {p.type === "idea" && (
          <label className={styles.label}>
            What kind of idea is it?
            <input id="f-typeOther" value={p.typeOther} onChange={(e) => set("typeOther", e.target.value)} placeholder="e.g. a podcast episode, a comic, a photo essay" aria-invalid={!!errors.typeOther} aria-describedby={describedBy("typeOther")} />
            {err("typeOther")}
          </label>
        )}
      </Row>

      <Row
        n="03"
        title="Subject and format"
      >
        <label className={styles.label}>
          Subject area
          <select id="f-subject" value={p.subject} onChange={(e) => set("subject", e.target.value)} aria-invalid={!!errors.subject} aria-describedby={describedBy("subject")}>
            <option value="">Choose…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {err("subject")}
        </label>
        {p.subject === "other" && (
          <label className={styles.label}>
            Which subject?
            <input id="f-subjectOther" value={p.subjectOther} onChange={(e) => set("subjectOther", e.target.value)} aria-invalid={!!errors.subjectOther} aria-describedby={describedBy("subjectOther")} />
            {err("subjectOther")}
          </label>
        )}
        <fieldset className={styles.formats} aria-describedby={describedBy("formats")}>
          <legend className={styles.label}>Format (pick any)</legend>
          <div id="f-formats" tabIndex={-1} className={styles.chips}>
            {formats.map((f) => {
              const on = p.formats.includes(f);
              return (
                <label key={f} className={`${styles.chip} ${on ? styles.picked : ""}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set("formats", on ? p.formats.filter((x) => x !== f) : [...p.formats, f])}
                  />
                  {f}
                </label>
              );
            })}
          </div>
          {err("formats")}
        </fieldset>
      </Row>

      <Row
        n="04"
        title="The pitch"
        note={
          <>
            <p className={styles.noteTitle}>Your elevator pitch.</p>
            <p>In a sentence or two, what would you talk about, and what makes it interesting? Not just the topic, but the story in it.</p>
            <p className={styles.example}>
              &ldquo;Antibiotics are quietly losing the fight against bacteria. I want to look at how scientists are turning
              bacteria&apos;s own weapons, with a little help from AI, into the next line of defence.&rdquo;
            </p>
            <p className={styles.example}>
              &ldquo;Ashwagandha is all over TikTok as a cure for stress. I&apos;d dig into what the research actually says, and
              why so many students are taking it.&rdquo;
            </p>
          </>
        }
      >
        <label className={styles.label}>
          Explain what you want to talk about in a sentence or two
          <textarea id="f-angle" rows={4} value={p.angle} onChange={(e) => set("angle", e.target.value)} aria-invalid={!!errors.angle} aria-describedby={describedBy("angle")} />
          {err("angle")}
        </label>
      </Row>

      <Row
        n="05"
        title="Why Science Sphere?"
      >
        <label className={styles.label}>
          Why does it belong in Science Sphere?
          <textarea id="f-why" rows={5} value={p.why} onChange={(e) => set("why", e.target.value)} aria-invalid={!!errors.why} aria-describedby={describedBy("why")} />
          {err("why")}
        </label>
      </Row>

      <Row
        n="06"
        title="Files (optional)"
        note={
          <p>
            If you have something to show, add it: a draft, sketch, photo or recording. If your work lives somewhere else,
            a document with a link in it is fine. Up to {MAX_FILES} files, each under {MAX_FILE_MB}MB.
          </p>
        }
      >
        <label className={styles.drop} aria-invalid={!!errors.files}>
          <input id="f-files" type="file" multiple disabled={sending} aria-describedby={describedBy("files")} onChange={(e) => set("files", [...(e.target.files ?? [])])} />
          <span>{p.files.length ? `${p.files.length} file${p.files.length > 1 ? "s" : ""} chosen` : "Choose files"}</span>
          <span className="label">or drop them here</span>
        </label>
        {p.files.length > 0 && (
          <ul className={styles.fileList}>
            {p.files.map((f) => (
              <li key={f.name}>
                {f.name} <span className="label">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
              </li>
            ))}
          </ul>
        )}
        {err("files")}
        {bigFiles.length > 0 && (
          <p className={styles.warning}>
            {bigFiles.map((f) => f.name).join(", ")} {bigFiles.length > 1 ? "are" : "is"} over {MAX_FILE_MB}MB, so it can&apos;t
            be sent. Take it out, and put a link to it in your pitch instead.
          </p>
        )}
      </Row>

      <div className={styles.sendRow}>
        <button type="submit" className={styles.primary} disabled={sending}>
          {sending ? (progress ? `Uploading ${progress.count > 1 ? `${progress.index} of ${progress.count}` : "file"}… ${progress.percent}%` : "Sending…") : "Send my pitch →"}
        </button>
        <p className="label">{byEmail ? "opens your email app" : "we reply within a week"}</p>
      </div>
      {failure && (
        <p className={styles.failure} role="alert">
          {failure}
        </p>
      )}
    </form>
  );
}
