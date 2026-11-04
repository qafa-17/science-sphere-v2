"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  MAX_FILE_MB,
  type Pitch,
  formats,
  storyTypes,
  subjects,
  submitPitch,
  years,
} from "@/lib/pitch";
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

type Errors = Partial<Record<keyof Pitch, string>>;

function check(p: Pitch): Errors {
  const e: Errors = {};
  if (!p.name.trim()) e.name = "Tell us your name.";
  if (!/^\S+@\S+\.\S+$/.test(p.email.trim())) e.email = "We need an email we can reply to.";
  if (!p.program.trim()) e.program = "Your degree and program, e.g. BSc, Biology.";
  if (!p.year) e.year = "Pick your year.";
  if (!p.type) e.type = "Pick the kind of story closest to yours.";
  if (p.type === "idea" && !p.typeOther.trim()) e.typeOther = "Tell us what kind of idea it is.";
  if (!p.subject) e.subject = "Pick a subject area.";
  if (p.subject === "other" && !p.subjectOther.trim()) e.subjectOther = "Tell us the subject.";
  if (p.formats.length === 0) e.formats = "Pick at least one format.";
  if (p.angle.trim().length < 20) e.angle = "A sentence or two about your angle, please.";
  if (p.why.trim().length < 20) e.why = "A sentence or two on why it fits Science Sphere.";
  if (p.files.length === 0) e.files = "Upload at least one file. A document with a link in it is fine.";
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

export default function PitchForm() {
  const [p, setP] = useState<Pitch>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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
    setSending(true);
    const res = await submitPitch(p);
    setSending(false);
    if (res.ok) {
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const err = (k: keyof Pitch) =>
    errors[k] ? (
      <p className={styles.error} id={`e-${k}`}>
        {errors[k]}
      </p>
    ) : null;
  const describedBy = (k: keyof Pitch) => (errors[k] ? `e-${k}` : undefined);

  if (sent) {
    return (
      <div className={styles.sent} role="status">
        <p className="label">transmission received // {new Date().toLocaleDateString("en-CA")}</p>
        <h2>Thank you, {p.name.split(" ")[0]}!</h2>
        <p>
          Your pitch is with the editors. We usually reply within a week, at <strong>{p.email}</strong>.
        </p>
        <div className={styles.specimen}>
          <p className="label">specimen // {p.type === "idea" ? p.typeOther : type?.name}</p>
          <p className={styles.specimenTitle}>{p.angle.slice(0, 120)}</p>
          <p className="label">
            subject: {p.subject === "other" ? p.subjectOther : subject?.label} &nbsp; format: {p.formats.join(", ").toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            setP(empty);
            setSent(false);
          }}
        >
          Pitch another story
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
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
        title="The angle"
      >
        <label className={styles.label}>
          What&apos;s your story really about?
          <textarea id="f-angle" rows={5} value={p.angle} onChange={(e) => set("angle", e.target.value)} aria-invalid={!!errors.angle} aria-describedby={describedBy("angle")} />
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
        title="Files"
        note={
          <p>
            Whatever format you choose, upload something: a draft, sketch, photo or recording. If your work lives somewhere
            else, a document with a link in it is fine. Keep each file under {MAX_FILE_MB}MB.
          </p>
        }
      >
        <label className={styles.drop} aria-invalid={!!errors.files}>
          <input id="f-files" type="file" multiple aria-describedby={describedBy("files")} onChange={(e) => set("files", [...(e.target.files ?? [])])} />
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
            {bigFiles.map((f) => f.name).join(", ")} {bigFiles.length > 1 ? "are" : "is"} over {MAX_FILE_MB}MB. It may not send;
            you can share a link instead in the angle box.
          </p>
        )}
      </Row>

      <div className={styles.sendRow}>
        <button type="submit" className={styles.primary} disabled={sending}>
          {sending ? "Sending…" : "Send my pitch →"}
        </button>
        <p className="label">we reply within a week</p>
      </div>
    </form>
  );
}
