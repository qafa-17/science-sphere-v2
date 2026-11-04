"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import { cloudBank, grainDataUrl, mountainLayer, nightSky } from "@/lib/scenes/heights";
import { createOcean } from "@/lib/scenes/ocean";
import { createSphere } from "@/lib/scenes/sphere";
import BootLine from "./BootLine";
import styles from "./Lab.module.css";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const between = (p: number, a: number, b: number) => smooth(clamp((p - a) / (b - a)));

// The world, top to bottom, in screen-heights.
const SPHERE_Y = 0.5;
const NIGHT = [0.8, 2.6]; // the painted milky way
const CLOUDS = [3.5, 5.0];
const SURFACE = 5.8; // the foot of the mountains, and the sea
const WORLD = 8.0;

// Where the camera's top edge sits (in screen-heights) as you scroll from 0 to 1.
const CAMERA: [number, number][] = [
  [0, 0],
  [0.16, 0],
  [0.24, 1.0],
  [0.34, 1.0],
  [0.58, 5.15],
  [0.66, 5.15],
  [0.76, 6.9],
  [1, 6.9],
];

// When each card shows: [fade in from, fully in, start fading, gone]
const CARDS = {
  title: [-1, 0, 0.05, 0.09],
  pitch: [0.24, 0.27, 0.34, 0.38],
  issues: [0.76, 0.8, 1.1, 1.2],
} as const;

const ISSUES = [
  { label: "ISSUE_003 // FALL2026", href: "/issues/3" },
  { label: "ISSUE_002 // WINTER2026", href: "/issues/2" },
  { label: "ISSUE_001 // FALL2025", href: "/issues/1" },
];

function cameraAt(p: number) {
  for (let i = 1; i < CAMERA.length; i++) {
    const [p1, c1] = CAMERA[i];
    const [p0, c0] = CAMERA[i - 1];
    if (p <= p1) return c0 + (c1 - c0) * smooth(clamp((p - p0) / (p1 - p0 || 1)));
  }
  return CAMERA[CAMERA.length - 1][1];
}

/**
 * Prototype 06: the journey. It opens on the sphere, which shrinks away into a
 * star in the night sky. Scroll on down through a long evening sky and its
 * clouds, past painted mountains, and into the sea with the fish.
 */
export default function Journey() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const grainEl = wrap.querySelector<HTMLElement>("[data-grain]");
    if (grainEl) grainEl.style.backgroundImage = `url(${grainDataUrl()})`;
    const cards = new Map<string, HTMLElement>();
    wrap.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => cards.set(el.dataset.card!, el));

    const ocean = createOcean();
    const sphere = createSphere();
    let skyGrad: CanvasGradient | null = null;
    let rayGrad: CanvasGradient | null = null;
    let builtFor = "";
    let mountains: HTMLCanvasElement[] = [];
    let banks: { img: HTMLCanvasElement; x: number; y: number; depth: number; drift: number }[] = [];
    let night: HTMLCanvasElement | null = null;
    let stars: { x: number; y: number; r: number; p: number }[] = [];

    const build = (w: number, h: number) => {
      ocean.resize(w, SURFACE * h, WORLD * h);
      const mw = Math.ceil(w * 1.1);
      mountains = [
        mountainLayer(mw, h * 0.62, 1, { top: "#a9b8f2", bottom: "#8193e2", light: "rgba(255,255,255,0.55)", shadow: "rgba(60,70,170,0.45)" }, 0.5),
        mountainLayer(mw, h * 0.5, 2, { top: "#6f84dc", bottom: "#4b5fc4", light: "rgba(220,230,255,0.5)", shadow: "rgba(25,35,120,0.5)" }, 0.5),
        mountainLayer(mw, h * 0.37, 3, { top: "#3a4fb4", bottom: "#26388f", light: "rgba(170,190,255,0.45)", shadow: "rgba(8,15,70,0.55)" }, 0.5),
        mountainLayer(mw, h * 0.24, 4, { top: "#1b2a78", bottom: "#0d1748", light: "rgba(120,150,240,0.45)", shadow: "rgba(0,0,30,0.6)" }, 0.5),
      ];
      const rand = seeded(4);
      banks = Array.from({ length: 7 }, (_, i) => ({
        img: cloudBank(Math.min(w * 0.7, 900), h * 0.3, 10 + i),
        x: rand() * w - w * 0.2,
        y: h * (CLOUDS[0] + (i / 6) * (CLOUDS[1] - CLOUDS[0])),
        depth: 0.3 + rand() * 0.6,
        drift: 6 + rand() * 10,
      }));
      night = nightSky(w, h * (NIGHT[1] - NIGHT[0]), 6);
      stars = Array.from({ length: Math.floor((w * h * 3) / 6000) }, () => ({
        x: rand() * w,
        y: rand() * h * 3.2,
        r: 0.5 + rand() * 1.1,
        p: rand() * 6.28,
      }));
      skyGrad = null;
      rayGrad = null;
      builtFor = `${w}x${h}`;
    };

    return runCanvas(canvasRef.current!, (f) => {
      const { ctx, w, h, t, dt, pointer } = f;
      if (builtFor !== `${w}x${h}`) build(w, h);
      const at = (y: number) => y * h;
      const r = wrap.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight + 56));
      const cam = cameraAt(p) * h;
      const wp = { x: pointer.x, y: pointer.y + cam, inside: pointer.inside };
      const lean = pointer.inside ? pointer.x / w - 0.5 : 0;
      const visible = (y0: number, y1: number) => y1 > cam && y0 < cam + h;

      ctx.save();
      ctx.translate(0, -cam);

      // one long gradient, from the sphere's deep space down to the deep sea
      if (!skyGrad) {
        skyGrad = ctx.createLinearGradient(0, 0, 0, at(WORLD));
        const stop = (y: number, c: string) => skyGrad!.addColorStop(y / WORLD, c);
        stop(0, "#0d0630");
        stop(0.7, "#0b0f3a");
        stop(1.7, "#0a1240");
        stop(2.6, "#0e1b55");
        stop(3.4, "#172c80");
        stop(4.2, "#2440b0");
        stop(4.9, "#3f62d8");
        stop(5.5, "#7d95ea");
        stop(5.8, "#a9b8f2");
        stop(5.801, "#3a64c8");
        stop(6.5, "#1f3fa0");
        stop(7.2, "#0d1c66");
        stop(8.0, "#050a2e");
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, cam, w, h);

      // ---- night: the painted milky way and twinkling stars (brighter near the cursor)
      if (visible(0, at(3.3))) {
        if (night) ctx.drawImage(night, 0, at(NIGHT[0]));
        for (const s of stars) {
          if (s.y < cam - 4 || s.y > cam + h + 4) continue;
          const near = wp.inside ? Math.max(0, 1 - Math.hypot(s.x - wp.x, s.y - wp.y) / 140) : 0;
          // stars fade out as the sky brightens further down
          const sky = 1 - clamp((s.y / h - 2.4) / 0.9);
          ctx.globalAlpha = (0.35 + 0.35 * Math.sin(t * 1.4 + s.p) + near * 0.5) * sky;
          ctx.fillStyle = "#eef2ff";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * (1 + near * 1.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // ---- clouds, drifting, with a little parallax
      for (const b of banks) {
        if (!visible(b.y - h * 0.2, b.y + h * 0.3)) continue;
        const bw = b.img.width;
        const x = ((b.x + t * b.drift - lean * 40 * b.depth) % (w + bw)) - bw * 0.5;
        ctx.globalAlpha = 0.92;
        ctx.drawImage(b.img, x, b.y - h * 0.15);
      }
      ctx.globalAlpha = 1;

      // ---- the mountains, far to near, with a little parallax
      if (visible(at(SURFACE - 0.85), at(SURFACE + 0.05))) {
        mountains.forEach((m, i) => {
          ctx.drawImage(m, -w * 0.05 - lean * 12 * (i + 1), at(SURFACE) - m.height + 2);
        });
      }

      // ---- the waterline
      ctx.fillStyle = "rgba(220,230,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(0, at(SURFACE));
      for (let x = 0; x <= w; x += 12) ctx.lineTo(x, at(SURFACE) + Math.sin(x * 0.03 + t * 1.6) * 3);
      ctx.lineTo(w, at(SURFACE) + 6);
      ctx.lineTo(0, at(SURFACE) + 6);
      ctx.fill();

      // ---- the deep: light rays and the fish
      if (visible(at(SURFACE), at(WORLD))) {
        if (!rayGrad) {
          rayGrad = ctx.createLinearGradient(0, at(SURFACE), 0, at(SURFACE + 1.3));
          rayGrad.addColorStop(0, "rgba(200,225,255,0.16)");
          rayGrad.addColorStop(1, "rgba(200,225,255,0)");
        }
        ctx.fillStyle = rayGrad;
        for (let i = 0; i < 6; i++) {
          const x = w * (0.1 + i * 0.17) + Math.sin(t * 0.3 + i) * 30;
          ctx.beginPath();
          ctx.moveTo(x - 30, at(SURFACE));
          ctx.lineTo(x + 30, at(SURFACE));
          ctx.lineTo(x + 160, at(SURFACE + 1.3));
          ctx.lineTo(x + 40, at(SURFACE + 1.3));
          ctx.fill();
        }
        ocean.update(dt, wp);
        ocean.draw(ctx, cam, cam + h);
      }
      ctx.restore();

      // ---- the sphere at the top: it shrinks away into a star as you scroll
      const sy = at(SPHERE_Y) - cam;
      if (sy > -h * 0.6) {
        const away = between(p, 0.05, 0.16);
        const R0 = Math.min(w, h) * 0.36;
        const R = R0 * (1 - away) + 3 * away;
        // the soft deep-blue light behind it, as in prototype 01
        const glowR = Math.max(w, h) * 0.7 * (1 - away * 0.85);
        const bg = ctx.createRadialGradient(w / 2, sy, 0, w / 2, sy, glowR);
        bg.addColorStop(0, `rgba(24,49,79,${0.9 * (1 - away * 0.6)})`);
        bg.addColorStop(1, "rgba(24,49,79,0)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, sy - glowR, w, glowR * 2);
        sphere.draw(f, { cx: w / 2, cy: sy, radius: R, background: false, alpha: 1 - between(p, 0.14, 0.17) });
        // what's left is a star
        const star = between(p, 0.11, 0.16);
        if (star > 0) {
          const s = 3 + Math.sin(t * 2) * 0.6;
          const g = ctx.createRadialGradient(w / 2, sy, 0, w / 2, sy, s * 8);
          g.addColorStop(0, `rgba(240,250,210,${star})`);
          g.addColorStop(0.2, `rgba(230,249,175,${0.5 * star})`);
          g.addColorStop(1, "rgba(139,190,178,0)");
          ctx.fillStyle = g;
          ctx.fillRect(w / 2 - s * 8, sy - s * 8, s * 16, s * 16);
        }
      }

      // cards
      for (const [key, [a, b, c, d]] of Object.entries(CARDS)) {
        const el = cards.get(key);
        if (!el) continue;
        const o = between(p, a, b) * (1 - between(p, c, d));
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 24}px)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
    });
  }, []);

  return (
    <div ref={wrapRef} className={styles.journeyWrap}>
      <div className={styles.diveStage}>
        <canvas ref={canvasRef} className={`${styles.canvas} ${styles.scrollCanvas}`} aria-hidden="true" />
        <div data-grain className={styles.grain} aria-hidden="true" />
        <div className={styles.overlay}>
          <BootLine text="> sci_sphere.sys // prototype_06" />
        </div>

        <section data-card="title" className={styles.diveTitle}>
          <h1 className={styles.title}>
            Science
            <br />
            Sphere
          </h1>
          <p className="label">the mru science experience</p>
          <p className={`label ${styles.scrollHint}`}>scroll ↓</p>
        </section>

        <section data-card="pitch" className={`${styles.card} ${styles.cardLeft} ${styles.nightCard}`} aria-label="This month's pitch meeting">
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

        <section data-card="issues" className={`${styles.card} ${styles.cardLeft} ${styles.nightCard}`} aria-label="Issues">
          <p className="label">archive log // 3 issues</p>
          <h2>The issues</h2>
          <ul className={styles.issueList}>
            {ISSUES.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
