"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Member } from "@/lib/team";
import styles from "@/app/team/team.module.css";

/** Types its text out like a terminal once `go` turns on, then calls `done`. */
function Typed({ text, go, speed = 28, onDone }: { text: string; go: boolean; speed?: number; onDone?: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show it all at once
      setN(text.length);
      onDone?.();
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) {
        clearInterval(t);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, text, speed]);
  return (
    <>
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span className="skip">{text}</span>
    </>
  );
}

function Person({ m, shown, index }: { m: Member; shown: boolean; index: number }) {
  // name, then role, then subjects, one after another
  const [step, setStep] = useState(0);
  const expertise = m.expertise.join(" | ") + (m.expertise[m.expertise.length - 1].endsWith(".") ? "" : ".");
  const right = index % 2 === 1;
  return (
    <section className={`${styles.row} ${right ? styles.rowRight : ""} ${shown ? styles.shown : ""}`} aria-label={m.name}>
      <Link href={`/team/ids#${m.id}`} className={styles.face} aria-label={`${m.name}'s ID card`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.photo} alt="" style={{ height: `${100 * m.faceScale}%` }} />
      </Link>
      <div className={styles.info}>
        <span data-dot className={styles.dot} aria-hidden="true" />
        <h2 className={styles.name}>
          <Typed text={m.name} go={shown} onDone={() => setStep(1)} />
          {shown && step === 0 && <span className={styles.caret}>_</span>}
        </h2>
        <p className={styles.role}>
          <Typed text={m.role} go={step >= 1} speed={20} onDone={() => setStep(2)} />
          {step === 1 && <span className={styles.caret}>_</span>}
        </p>
        <p className={styles.expertise}>
          <Typed text={expertise} go={step >= 2} speed={20} onDone={() => setStep(3)} />
          {step === 2 && <span className={styles.caret}>_</span>}
        </p>
        <Link href={`/team/ids#${m.id}`} className={`${styles.more} ${step >= 3 ? styles.moreOn : ""}`}>
          learn more →
        </Link>
      </div>
    </section>
  );
}

/**
 * The team, revealed as you scroll: a red line grows down the page from one
 * person's dot to the next. When it reaches a dot, the dot pops and glows,
 * the person floats in, and their details type themselves out.
 */
export default function TeamReveal({ team }: { team: Member[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [reached, setReached] = useState(0); // how many people the line has reached

  useEffect(() => {
    const wrap = wrapRef.current!;
    let pts: { x: number; y: number }[] = [];
    let total = 0;
    let raf = 0;

    const measure = () => {
      const box = wrap.getBoundingClientRect();
      pts = [...wrap.querySelectorAll<HTMLElement>("[data-dot]")].map((d) => {
        const r = d.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
      svgRef.current!.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      lineRef.current!.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
      total = pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
      lineRef.current!.style.strokeDasharray = `${total}`;
    };

    const frame = () => {
      raf = 0;
      if (!pts.length) return;
      const box = wrap.getBoundingClientRect();
      // the tip of the line follows a point 60% of the way down the screen
      const tipY = window.innerHeight * 0.6 - box.top;
      let drawn = 0;
      let count = 0;
      for (let i = 0; i < pts.length; i++) {
        if (tipY >= pts[i].y) count = i + 1;
        if (i === 0) continue;
        const a = pts[i - 1];
        const b = pts[i];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        const k = Math.max(0, Math.min(1, (tipY - a.y) / (b.y - a.y)));
        drawn += seg * k;
      }
      lineRef.current!.style.strokeDashoffset = `${total - drawn}`;
      setReached((r) => Math.max(r, count)); // once someone appears, they stay
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    measure();
    frame();
    const ro = new ResizeObserver(() => {
      measure();
      frame();
    });
    ro.observe(wrap);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.people}>
      <svg ref={svgRef} className={styles.lines} aria-hidden="true">
        <polyline ref={lineRef} />
      </svg>
      {team.map((m, i) => (
        <Person key={m.id} m={m} index={i} shown={i < reached} />
      ))}
    </div>
  );
}
