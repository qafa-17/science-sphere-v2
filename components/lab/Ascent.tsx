"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import { cloudBank, drawFlareStar, drawSatellite, grainDataUrl, mountainLayer, planetEdge } from "@/lib/scenes/heights";
import { createOcean } from "@/lib/scenes/ocean";
import { createSphere } from "@/lib/scenes/sphere";
import BootLine from "./BootLine";
import styles from "./Lab.module.css";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const between = (p: number, a: number, b: number) => smooth(clamp((p - a) / (b - a)));

// The world, top to bottom, in screen-heights.
const BEACON_Y = 0.42; // the bright star at the very top
const SATELLITE_Y = 1.55;
const PLANET_TOP = 2.0; // the curve of the planet, seen from orbit
const SURFACE = 3.8; // the sea
const WORLD = 6.0;

// Where the camera's top edge sits (in screen-heights) as you scroll from 0 to 1.
const CAMERA: [number, number][] = [
  [0, 5.0],
  [0.06, 5.0],
  [0.24, 3.0],
  [0.36, 3.0],
  [0.5, 1.2],
  [0.62, 1.2],
  [0.72, 0],
  [1, 0],
];

// When each card shows: [fade in from, fully in, start fading, gone]
const CARDS = {
  title: [-1, 0, 0.05, 0.1],
  pitch: [0.25, 0.29, 0.36, 0.41],
  issues: [0.5, 0.53, 0.6, 0.64],
  beacon: [0.7, 0.72, 0.76, 0.79],
} as const;

const ISSUES = [
  { label: "ISSUE_003 // FALL2026", href: "/issues/3" },
  { label: "ISSUE_002 // WINTER2026", href: "/issues/2" },
  { label: "ISSUE_001 // FALL2025", href: "/issues/1" },
];

// the star-sphere's colours: white light with blue edges
const STAR_COLOURS = { line: "150,175,255", glow: "255,255,255", dot: "235,242,255", accent: "190,210,255", rim: "120,150,255" };

function cameraAt(p: number) {
  for (let i = 1; i < CAMERA.length; i++) {
    const [p1, c1] = CAMERA[i];
    const [p0, c0] = CAMERA[i - 1];
    if (p <= p1) return c0 + (c1 - c0) * smooth(clamp((p - p0) / (p1 - p0 || 1)));
  }
  return CAMERA[CAMERA.length - 1][1];
}

/**
 * Prototype 06: the ascent. Start among the fish in the deep sea, rise past
 * the surface, painted mountains and clouds, up through the atmosphere to
 * orbit, past a satellite over the curve of the planet, to one bright star.
 * Fly into the star and it opens into the sphere.
 */
export default function Ascent() {
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
    let mountains: { img: HTMLCanvasElement; depth: number }[] = [];
    let banks: { img: HTMLCanvasElement; x: number; y: number; depth: number; drift: number }[] = [];
    let planet: HTMLCanvasElement | null = null;
    let stars: { x: number; y: number; r: number; p: number; flare: boolean }[] = [];

    const build = (w: number, h: number) => {
      ocean.resize(w, SURFACE * h, WORLD * h);
      mountains = [
        { img: mountainLayer(w * 1.1, h * 0.36, 1, "#8a9cf0", "#5a6fd0", 4), depth: 0.2 },
        { img: mountainLayer(w * 1.1, h * 0.27, 2, "#3f55bf", "#2b3d96", 6), depth: 0.45 },
        { img: mountainLayer(w * 1.1, h * 0.19, 3, "#1b2b78", "#0f1a4e", 8), depth: 0.8 },
      ];
      const rand = seeded(4);
      banks = Array.from({ length: 6 }, (_, i) => ({
        img: cloudBank(Math.min(w * 0.7, 900), h * 0.3, 10 + i),
        x: rand() * w - w * 0.2,
        y: h * (2.55 + i * 0.15 + rand() * 0.05),
        depth: 0.3 + rand() * 0.6,
        drift: 6 + rand() * 10,
      }));
      planet = planetEdge(w, h * 0.9, h * 0.1, 8);
      stars = Array.from({ length: Math.floor((w * h * 2.2) / 3500) }, () => ({
        x: rand() * w,
        y: rand() * h * 2.3,
        r: 0.4 + rand() * 1.1,
        p: rand() * 6.28,
        flare: rand() < 0.03,
      }));
      skyGrad = null;
      rayGrad = null;
      builtFor = `${w}x${h}`;
    };

    return runCanvas(
      canvasRef.current!,
      (f) => {
        const { ctx, w, h, t, dt, pointer } = f;
        if (builtFor !== `${w}x${h}`) build(w, h);
        const at = (y: number) => y * h;
        const r = wrap.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - window.innerHeight + 56));
        const cam = cameraAt(p) * h;
        const wp = { x: pointer.x, y: pointer.y + cam, inside: pointer.inside };
        const lean = pointer.inside ? pointer.x / w - 0.5 : 0; // for gentle parallax

        // at the very end, the whole world zooms into the bright star
        const zoomIn = between(p, 0.74, 0.86);
        const zoom = 1 + zoomIn * zoomIn * 10;
        const bx = w / 2;
        const by = at(BEACON_Y) - cam;

        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(zoom, zoom);
        ctx.translate(-bx, -by);
        ctx.translate(0, -cam);

        // one long gradient from deep space to the deep sea
        if (!skyGrad) {
          skyGrad = ctx.createLinearGradient(0, 0, 0, at(WORLD));
          const stop = (y: number, c: string) => skyGrad!.addColorStop(y / WORLD, c);
          stop(0, "#01030c");
          stop(1.2, "#030820");
          stop(2.0, "#071640");
          stop(2.3, "#0c2560");
          stop(2.8, "#1d43a8");
          stop(3.3, "#3f62d8");
          stop(3.8, "#8aa0ee");
          stop(3.801, "#3a64c8");
          stop(4.5, "#1f3fa0");
          stop(5.2, "#0d1c66");
          stop(6.0, "#050a2e");
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, cam, w, h);

        const visible = (y0: number, y1: number) => y1 > cam && y0 < cam + h;

        // ---- the deep: light rays, fish, bubbles
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

        // ---- distant stars, the satellite and the planet's curve
        if (visible(0, at(PLANET_TOP + 0.9))) {
          for (const s of stars) {
            if (s.y < cam - 10 || s.y > cam + h + 10) continue;
            const tw = 0.45 + 0.4 * Math.sin(t * 1.2 + s.p);
            if (s.flare) drawFlareStar(ctx, s.x, s.y, 1.2, t + s.p);
            else {
              ctx.globalAlpha = tw;
              ctx.fillStyle = "#dfe8ff";
              ctx.beginPath();
              ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
          if (planet) ctx.drawImage(planet, 0, at(PLANET_TOP - 0.1));
          const sx = w * (w > 900 ? 0.68 : 0.62) + Math.sin(t * 0.15) * 20;
          const sy = at(SATELLITE_Y) + Math.sin(t * 0.25) * 10;
          drawSatellite(ctx, sx, sy, Math.min(1, w / 1100), -0.25 + Math.sin(t * 0.12) * 0.08 + lean * 0.25);
        }

        // ---- clouds, drifting, with a little parallax
        for (const b of banks) {
          if (!visible(b.y - h * 0.2, b.y + h * 0.3)) continue;
          const bw = b.img.width;
          const x = ((b.x + t * b.drift - lean * 40 * b.depth) % (w + bw)) - bw * 0.5;
          ctx.globalAlpha = 0.9;
          ctx.drawImage(b.img, x, b.y - h * 0.15);
        }
        ctx.globalAlpha = 1;

        // ---- the mountains along the shore, far to near
        if (visible(at(SURFACE - 0.4), at(SURFACE + 0.05))) {
          for (const m of mountains) {
            const mh = m.img.height;
            ctx.drawImage(m.img, -w * 0.05 - lean * 30 * m.depth, at(SURFACE) - mh + 2);
          }
        }

        // ---- the waterline
        ctx.fillStyle = "rgba(220,230,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(0, at(SURFACE));
        for (let x = 0; x <= w; x += 12) ctx.lineTo(x, at(SURFACE) + Math.sin(x * 0.03 + t * 1.6) * 3);
        ctx.lineTo(w, at(SURFACE) + 6);
        ctx.lineTo(0, at(SURFACE) + 6);
        ctx.fill();

        ctx.restore();

        // ---- the bright star: it grows as we fly at it, flashes, and opens into the sphere
        const dim = between(p, 0.78, 0.86);
        if (dim > 0) {
          ctx.fillStyle = `rgba(2,4,16,${dim})`;
          ctx.fillRect(0, 0, w, h);
        }
        const open = between(p, 0.87, 0.95);
        if (open > 0) {
          const R = Math.min(w, h) * 0.3;
          const cy = by + (h / 2 - by) * open;
          // the sphere as a star: a white core, a blue halo, flares and points of light
          ctx.globalAlpha = open;
          drawFlareStar(ctx, w / 2, cy, R * 0.16 * open, t);
          ctx.globalAlpha = 1;
          sphere.draw(f, {
            alpha: open,
            cx: w / 2,
            cy,
            radius: Math.max(4, R * (0.3 + 0.7 * open)),
            background: false,
            colours: STAR_COLOURS,
          });
        }
        const starFade = 1 - between(p, 0.86, 0.89);
        if (cam < h * 0.2 && starFade > 0) {
          ctx.globalAlpha = starFade;
          drawFlareStar(ctx, bx, by, Math.min(w, h) * 0.008 * (1 + zoomIn * zoomIn * zoomIn * 30), t);
          ctx.globalAlpha = 1;
        }
        const flash = between(p, 0.83, 0.865) * (1 - between(p, 0.875, 0.93));
        if (flash > 0) {
          ctx.fillStyle = `rgba(235,242,255,${flash})`;
          ctx.fillRect(0, 0, w, h);
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
      },
    );
  }, []);

  return (
    <div ref={wrapRef} className={styles.ascentWrap}>
      <div className={styles.diveStage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div data-grain className={styles.grain} aria-hidden="true" />
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
          <p className="label">incoming transmission // archive log</p>
          <h2>The issues</h2>
          <ul className={styles.issueList}>
            {ISSUES.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section data-card="beacon" className={`${styles.diveTitle} ${styles.creamText}`} aria-hidden="true">
          <p className={`label ${styles.beaconLabel}`}>signal detected // keep scrolling</p>
        </section>
      </div>
    </div>
  );
}
