"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { runCanvas } from "@/lib/canvasLoop";
import { createCircuit } from "@/lib/scenes/circuit";
import { createSky } from "@/lib/scenes/sky";
import { createSphere } from "@/lib/scenes/sphere";
import BootLine from "./BootLine";
import styles from "./Lab.module.css";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** 0 before a, 1 after b, eased in between */
const between = (p: number, a: number, b: number) => {
  const x = clamp((p - a) / (b - a));
  return x * x * (3 - 2 * x);
};

// when each card is on screen, as [fade in from, fully in, start fading, gone] in scroll progress
const CARDS = {
  title: [-1, 0, 0.08, 0.16],
  pitch: [0.36, 0.42, 0.56, 0.62],
  issues: [0.78, 0.82, 0.87, 0.9],
  contact: [0.9, 0.94, 1.1, 1.2],
} as const;

/**
 * Prototype 04: scrolling is a zoom. The pixel sky's moon grows into the
 * network sphere; then you dive into the sphere and come out on the circuit
 * board. The landing page's sections ride along the way.
 */
export default function Dive() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sky = createSky();
    const sphere = createSphere();
    const circuit = createCircuit();
    const wrap = wrapRef.current!;
    const cards = new Map<string, HTMLElement>();
    wrap.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => cards.set(el.dataset.card!, el));

    return runCanvas(
      canvasRef.current!,
      (f) => {
        const { ctx, w, h } = f;
        // how far through the dive we've scrolled, 0..1
        const r = wrap.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - window.innerHeight + 56));

        ctx.fillStyle = "#0D0630";
        ctx.fillRect(0, 0, w, h);

        // where the sphere ends up: a little right of centre on wide screens, so the cards fit
        const tx = w / 2 + (w > 900 ? w * 0.12 : 0);
        const ty = h / 2;

        // 1. the sky zooms in while the moon drifts toward that spot
        const m = sky.moon();
        const R0 = Math.min(w, h) * 0.34;
        const zoomIn = between(p, 0.04, 0.3);
        const skyZoom = 1 + zoomIn * 2.6;
        const shift = { x: (tx - m.x) * zoomIn, y: (ty - m.y) * zoomIn };
        const sphereIn = between(p, 0.2, 0.3);
        sky.draw(f, { zoom: skyZoom, shift, alpha: 1 - between(p, 0.24, 0.36), hideMoon: sphereIn > 0.5 });

        // 2. the moon becomes the sphere and grows to full size
        const settle = between(p, 0.24, 0.4);
        const dive = between(p, 0.58, 0.74);
        const moonR = m.r * skyZoom;
        const radius = (moonR + (R0 - moonR) * settle) * (1 + dive * dive * 9);
        sphere.draw(f, {
          alpha: sphereIn * (1 - between(p, 0.68, 0.76)),
          cx: m.x + shift.x + (tx - m.x - shift.x) * settle,
          cy: m.y + shift.y + (ty - m.y - shift.y) * settle,
          radius,
          background: false,
          through: dive,
        });

        // 3. out the other side: the circuit board grows from its chip
        const board = between(p, 0.64, 0.78);
        circuit.draw(f, { alpha: board, zoom: 0.35 + 0.65 * board, grow: between(p, 0.66, 0.84) });

        // the cards that ride along
        for (const [key, [a, b, c, d]] of Object.entries(CARDS)) {
          const el = cards.get(key);
          if (!el) continue;
          const o = between(p, a, b) * (1 - between(p, c, d));
          el.style.opacity = String(o);
          el.style.transform = `translateY(${(1 - o) * 24}px)`;
          el.style.visibility = o < 0.01 ? "hidden" : "visible";
        }
      },
      {
        onResize: (w, h) => {
          sky.resize(w, h);
          circuit.resize(w, h);
        },
      },
    );
  }, []);

  return (
    <div ref={wrapRef} className={styles.diveWrap}>
      <div className={styles.diveStage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.overlay}>
          <BootLine text="> sci_sphere.sys // prototype_04" />
        </div>

        <section data-card="title" className={styles.diveTitle}>
          <h1 className={styles.title}>
            Science
            <br />
            Sphere
          </h1>
          <p className="label">the mru science experience</p>
          <p className={`label ${styles.scrollHint}`}>scroll to dive ↓</p>
        </section>

        <section data-card="pitch" className={`${styles.card} ${styles.cardLeft}`} aria-label="This month's pitch meeting">
          <p className="label">specimen // pitch_meeting // nov 2026</p>
          <h2>This month&apos;s pitch meeting</h2>
          <dl>
            <dt className="label">day</dt>
            <dd>Thursday, November 20</dd>
            <dt className="label">time</dt>
            <dd>1:00pm – 2:00pm</dd>
            <dt className="label">where</dt>
            <dd>B231B, Lincoln Park building</dd>
          </dl>
          <Link href="/pitch" className={styles.cardButton}>
            Pitch a story →
          </Link>
        </section>

        <section data-card="issues" className={`${styles.card} ${styles.cardRight}`} aria-label="Issues">
          <p className="label">archive log // 3 files</p>
          <h2>The issues</h2>
          <ul className={styles.issueList}>
            <li>
              <Link href="/issues/3">issue_003 // fall2026</Link>
            </li>
            <li>issue_002 // winter2026</li>
            <li>issue_001 // fall2025</li>
          </ul>
        </section>

        <section data-card="contact" className={`${styles.card} ${styles.cardLeft}`} aria-label="Contact">
          <p className="label">transmission // open channel</p>
          <h2>Talk to us</h2>
          <p>
            <a href="mailto:sciencesphere@mtroyal.ca">sciencesphere@mtroyal.ca</a>
            <br />
            <a href="https://instagram.com/mrusciencesphere" target="_blank" rel="noopener noreferrer">
              @mrusciencesphere ↗
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
