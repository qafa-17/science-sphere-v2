"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import { createSmoke, drawCloud, drawPlatform, drawRocket } from "@/lib/scenes/launch";
import { createOcean } from "@/lib/scenes/ocean";
import { createSpace } from "@/lib/scenes/space";
import { createSphere } from "@/lib/scenes/sphere";
import BootLine from "./BootLine";
import styles from "./Lab.module.css";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const between = (p: number, a: number, b: number) => smooth(clamp((p - a) / (b - a)));

// The world, top to bottom, in screen-heights: space, sky, the sea surface, the deep.
const SPHERE_Y = 0.5;
const PLANETS = [1.0, 2.0];
const SURFACE = 3.6;
const WORLD = 5.8;

// Where the camera's top edge sits (in screen-heights) as you scroll from 0 to 1.
const CAMERA: [number, number][] = [
  [0, 4.8],
  [0.08, 4.8],
  [0.24, 2.85],
  [0.36, 2.85],
  [0.52, 1.0],
  [0.68, 1.0],
  [0.82, 0],
  [1, 0],
];

// When each card shows: [fade in from, fully in, start fading, gone]
const CARDS = {
  title: [-1, 0, 0.05, 0.11],
  pitch: [0.26, 0.3, 0.4, 0.45],
  issues: [0.52, 0.55, 0.66, 0.7],
  contact: [0.8, 0.85, 1.1, 1.2],
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
 * Prototype 06: the ascent. You start among the fish in the deep sea, rise to
 * the surface where a rocket stands on its launch platform, ride it up through
 * an orange sky into space, past planets (the issues), up to the sphere.
 */
export default function Ascent() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const cards = new Map<string, HTMLElement>();
    wrap.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => cards.set(el.dataset.card!, el));
    const ocean = createOcean();
    const space = createSpace();
    const sphere = createSphere();
    const smoke = createSmoke();
    let clouds: { x: number; y: number; s: number }[] = [];
    let lastTap = -1;
    let skyGrad: CanvasGradient | null = null;
    let skyGradH = 0;

    // screen-heights to px
    const world = (h: number) => (y: number) => y * h;

    return runCanvas(
      canvasRef.current!,
      (f) => {
        const { ctx, w, h, t, dt, pointer, taps } = f;
        const at = world(h);
        const r = wrap.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - window.innerHeight + 56));
        const cam = cameraAt(p) * h;
        const wp = { x: pointer.x, y: pointer.y + cam, inside: pointer.inside };

        ctx.save();
        ctx.translate(0, -cam);

        // the sky and sea as one long gradient (made once per size)
        if (!skyGrad || skyGradH !== h) {
          skyGradH = h;
          skyGrad = ctx.createLinearGradient(0, 0, 0, at(WORLD));
          const stop = (y: number, c: string) => skyGrad!.addColorStop(y / WORLD, c);
          stop(0, "#0e1a20");
          stop(1.9, "#1d3640");
          stop(2.55, "#9c4a2c");
          stop(3.1, "#ec8f52");
          stop(3.6, "#f6dcb4");
          stop(3.601, "#4a86d8");
          stop(4.3, "#1f3fa0");
          stop(5.0, "#0d1c66");
          stop(5.8, "#050a2e");
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, cam, w, h);

        // ---- the deep: light rays, fish, bubbles
        if (cam + h > at(SURFACE)) {
          for (let i = 0; i < 6; i++) {
            const x = w * (0.1 + i * 0.17) + Math.sin(t * 0.3 + i) * 30;
            const ray = ctx.createLinearGradient(0, at(SURFACE), 0, at(SURFACE + 1.3));
            ray.addColorStop(0, "rgba(200,225,255,0.16)");
            ray.addColorStop(1, "rgba(200,225,255,0)");
            ctx.fillStyle = ray;
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

        // ---- the surface: a gently moving waterline
        ctx.fillStyle = "rgba(244,234,215,0.6)";
        ctx.beginPath();
        ctx.moveTo(0, at(SURFACE));
        for (let x = 0; x <= w; x += 12) ctx.lineTo(x, at(SURFACE) + Math.sin(x * 0.03 + t * 1.6) * 3);
        ctx.lineTo(w, at(SURFACE) + 6);
        ctx.lineTo(0, at(SURFACE) + 6);
        ctx.fill();

        // ---- the sky: clouds
        for (const c of clouds) if (c.y > cam - 100 && c.y < cam + h + 100) drawCloud(ctx, c.x + Math.sin(t * 0.1 + c.y) * 20, c.y, c.s);

        // ---- the launch
        const rocketH = Math.min(h * 0.36, w * 0.5);
        const padX = w > 900 ? w * 0.62 : w * 0.5;
        const deck = at(SURFACE) - rocketH * 0.05;
        drawPlatform(ctx, padX, at(SURFACE), rocketH);
        const thrust = between(p, 0.3, 0.36);
        const lift = between(p, 0.36, 0.42);
        // after lift-off the rocket holds its place on screen while the world falls away below
        const onScreen = (deck - cam) * (1 - lift) + h * 0.74 * lift - between(p, 0.47, 0.52) * h * 1.1;
        const rocketY = cam + onScreen;
        if (thrust > 0) smoke.emit(padX, deck, thrust * (1 - between(p, 0.4, 0.46)) * 3, dt);
        smoke.draw(ctx, dt);
        if (p < 0.53) drawRocket(ctx, padX, rocketY, rocketH, t, thrust);

        // ---- space: stars and the planets
        if (cam < at(PLANETS[1] + 0.2)) {
          space.draw(ctx, t, dt, wp, cam, cam + h);
          const tap = taps[taps.length - 1];
          if (tap && tap.t !== lastTap) {
            lastTap = tap.t;
            const hit = space.hit(tap.x, tap.y + cam);
            if (hit) routerRef.current.push(hit.href);
          }
        }
        ctx.restore();

        // ---- the sphere at the top, with the rocket in orbit
        const sy = at(SPHERE_Y) - cam;
        if (sy > -h * 0.6) {
          const R = Math.min(w, h) * 0.3;
          sphere.draw(f, {
            cx: w / 2,
            cy: sy,
            radius: R,
            background: false,
            colours: { line: "108,196,192", glow: "244,234,215", dot: "244,234,215", accent: "226,103,47", rim: "108,196,192" },
          });
          const orbit = between(p, 0.8, 0.86);
          if (orbit > 0) {
            const a = t * 0.6;
            ctx.save();
            ctx.globalAlpha = orbit;
            const ox = w / 2 + Math.cos(a) * R * 1.35;
            const oy = sy + Math.sin(a) * R * 0.45;
            ctx.translate(ox, oy);
            ctx.rotate(Math.atan2(Math.cos(a) * R * 0.45, -Math.sin(a) * R * 1.35));
            drawRocket(ctx, 0, rocketH * 0.06, rocketH * 0.12, t, 0.3);
            ctx.restore();
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
        // planets are links: let the cursor know (the CPU cursor grows its circuit)
        const c = canvasRef.current;
        if (!c) return;
        if (pointer.inside && space.hit(wp.x, wp.y)) c.dataset.clickable = "true";
        else delete c.dataset.clickable;
      },
      {
        onResize: (w, h) => {
          ocean.resize(w, SURFACE * h, WORLD * h);
          space.resize(w, h, PLANETS[0] * h, PLANETS[1] * h, ISSUES);
          const rand = seeded(9);
          clouds = Array.from({ length: 7 }, () => ({
            x: rand() * w,
            y: h * (2.35 + rand() * 0.75),
            s: 20 + rand() * 40,
          }));
        },
      },
    );
  }, []);

  return (
    <div ref={wrapRef} className={styles.ascentWrap}>
      <div className={styles.diveStage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.overlay}>
          <BootLine text="> sci_sphere.sys // prototype_06" />
        </div>

        <section data-card="title" className={`${styles.diveTitle} ${styles.creamText}`}>
          <h1 className={styles.title}>
            Science
            <br />
            Sphere
          </h1>
          <p className="label">the mru science experience</p>
          <p className={`label ${styles.scrollHint}`}>scroll to rise ↓</p>
        </section>

        <section data-card="pitch" className={`${styles.card} ${styles.cardLeft} ${styles.posterCard}`} aria-label="This month's pitch meeting">
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
            Launch your story →
          </Link>
        </section>

        <section data-card="issues" className={`${styles.banner} ${styles.posterCard}`} aria-label="Issues">
          <p className="label">archive log // 3 planets // tap one to open that issue</p>
          <nav className={styles.bannerLinks} aria-label="Issues">
            {ISSUES.map((i) => (
              <Link key={i.href} href={i.href}>
                {i.label}
              </Link>
            ))}
          </nav>
        </section>

        <section data-card="contact" className={`${styles.card} ${styles.cardLeft} ${styles.posterCard}`} aria-label="Contact">
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
