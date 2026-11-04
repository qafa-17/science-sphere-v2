"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Flipbook from "@/components/Flipbook";
import { type Issue, pageImages } from "@/lib/issues";
import styles from "./IssueArchive.module.css";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const between = (p: number, a: number, b: number) => smooth(clamp((p - a) / (b - a)));
const code = (n: number) => String(n).padStart(3, "0");
const tag = (season: string) => season.replace(/\s+/g, "").toUpperCase();

/**
 * The Issues page: every issue is a file in a stack, like an archive drawer.
 * Scrolling fans the files out one by one. Hovering one pulls it partway out
 * so you can see its cover; clicking pulls it out of the pile and opens it in
 * the reader below.
 */
export default function IssueArchive({ issues }: { issues: Issue[] }) {
  // oldest first, left to right, like the files in a drawer
  const files = useMemo(() => [...issues].sort((a, b) => a.number - b.number), [issues]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const hoverRef = useRef(-1);
  const pulledRef = useRef(-1);
  const [open, setOpen] = useState<Issue | null>(null);
  const [pulled, setPulled] = useState(-1);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const stack = wrap.querySelector<HTMLElement>("[data-stack]")!;
    const slots = [...wrap.querySelectorAll<HTMLElement>("[data-slot]")];
    const n = files.length;
    let raf = 0;
    let shown = files.map(() => 0); // eased hover amount per file

    const frame = () => {
      const r = wrap.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
      const W = stack.clientWidth;
      const H = stack.clientHeight;
      const coverW = H * 0.773;
      const titleW = Math.max(56, Math.min(150, W * 0.13));
      const archiveW = Math.max(44, Math.min(130, W * 0.11));
      const spreadW = Math.min(coverW * 0.62, (W - titleW - archiveW) / n);
      const closedW = 12;

      // each file slides out of the pile in turn as you scroll
      const widths = files.map((_, i) => {
        const out = between(p, 0.08 + i * (0.6 / n), 0.08 + (i + 1) * (0.6 / n));
        return closedW + (spreadW - closedW) * out;
      });
      const total = titleW + archiveW + widths.reduce((a, b) => a + b, 0);
      let x = Math.max(0, (W - total) / 2);
      shown = shown.map((v, i) => v + ((hoverRef.current === i ? 1 : 0) - v) * 0.18);

      slots.forEach((el) => {
        const kind = el.dataset.slot!;
        let w: number;
        let lift = 0;
        if (kind === "title") w = titleW;
        else if (kind === "archive") w = archiveW;
        else {
          const i = Number(kind);
          // hovering pulls the file out three quarters of the way
          w = widths[i] + Math.max(0, coverW * 0.75 - widths[i]) * shown[i];
          lift = shown[i] * 22;
          if (pulledRef.current === i) lift = H * 1.15;
        }
        el.style.transform = `translate3d(${x}px, ${-lift}px, 0)`;
        el.style.width = `${w}px`;
        el.style.setProperty("--h", `${H}px`);
        el.style.setProperty("--cover-w", `${coverW}px`);
        x += w;
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [files]);

  const openFile = (i: number) => {
    pulledRef.current = i;
    setPulled(i);
    // let it slide up out of the pile, then take the reader to it
    window.setTimeout(() => {
      setOpen(files[i]);
      readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
    window.setTimeout(() => {
      pulledRef.current = -1;
      setPulled(-1);
    }, 1600);
  };

  return (
    <>
      <div ref={wrapRef} className={styles.wrap}>
        <div className={styles.stage}>
          <div data-stack className={styles.stack}>
            {/* the cover file, like "GRID DAILY" in the reference */}
            <div data-slot="title" className={`${styles.file} ${styles.titleFile}`} style={{ zIndex: 20 }}>
              <h1 className={styles.bigTitle}>SCI_SPHERE ISSUES //</h1>
              <p className={styles.titleSmall}>
                The MRU science experience
                <br />
                Issues {code(files[0].number)}–{code(files[files.length - 1].number)}
              </p>
              <p className={styles.fileNo}>FILE_01//</p>
            </div>

            {/* the archive log */}
            <div data-slot="archive" className={`${styles.file} ${styles.archiveFile}`} style={{ zIndex: 19 }}>
              <span className={styles.tab} style={{ top: "6%" }}>
                ARCHIVE LOG
              </span>
              <div className={styles.archiveBody} aria-hidden="true">
                <span className={styles.barcode} />
                <span className={styles.archiveBig}>LOG</span>
                <span className={styles.archiveLine}>{files.length} FILES</span>
                <span className={styles.archiveLine}>PULL ONE</span>
                <span className={styles.archiveLine}>TO READ</span>
              </div>
            </div>

            {files.map((issue, i) => (
              <button
                key={issue.id}
                type="button"
                data-slot={i}
                className={`${styles.file} ${styles.issueFile} ${pulled === i ? styles.pulled : ""}`}
                style={{ zIndex: 18 - i, background: issue.tab }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") hoverRef.current = i;
                }}
                onPointerLeave={() => {
                  if (hoverRef.current === i) hoverRef.current = -1;
                }}
                onFocus={() => (hoverRef.current = i)}
                onBlur={() => (hoverRef.current = -1)}
                onClick={() => openFile(i)}
                aria-label={`Open Issue ${issue.number}, ${issue.season}`}
              >
                <span className={styles.coverWrap}>
                  {issue.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={issue.cover} alt="" className={styles.cover} />
                  ) : (
                    <span className={styles.coverPlaceholder}>
                      <strong>{code(issue.number)}</strong>
                      <span>COVER // COMING SOON</span>
                    </span>
                  )}
                </span>
                <span className={styles.tab} style={{ top: `${14 + i * 9}%`, background: issue.tab }}>
                  issue_{code(issue.number)} {"//"}
                  <br />
                  {tag(issue.season)}
                </span>
              </button>
            ))}
          </div>
          <p className={`label ${styles.hint}`}>
            <span className={styles.mouseOnly}>scroll to spread the files · hover to pull one out · click to read</span>
            <span className={styles.touchOnly}>scroll to spread the files · tap one to read</span>
          </p>
        </div>
      </div>

      {/* the reading room */}
      <section ref={readerRef} className={styles.reader} aria-label="Reader">
        {open ? (
          open.pageCount > 0 ? (
            <Flipbook
              key={open.id}
              pages={pageImages(open)}
              hotspots={open.hotspots}
              title={`Science Sphere Issue #${open.number}`}
              toolbarStart={
                <>
                  <button
                    type="button"
                    className={styles.back}
                    onClick={() => wrapRef.current?.scrollIntoView({ behavior: "smooth" })}
                  >
                    ↑ archive
                  </button>
                  <span className={styles.readerTitle}>
                    issue_{code(open.number)} {"//"} {tag(open.season)}
                  </span>
                </>
              }
            />
          ) : (
            <div className={styles.readerEmpty}>
              <p className="label">
                issue_{code(open.number)} {"//"} {tag(open.season)}
              </p>
              <p>This file&apos;s pages haven&apos;t been uploaded yet. Check back soon.</p>
            </div>
          )
        ) : (
          <div className={styles.readerEmpty}>
            <p className="label">reader // standing by</p>
            <p>Pull a file from the archive to read it here.</p>
          </div>
        )}
      </section>
    </>
  );
}
