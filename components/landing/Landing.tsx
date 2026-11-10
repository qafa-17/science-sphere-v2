"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import { createParticleCard, type ParticleCard } from "@/lib/scenes/particleCard";
import {
  cloudBank,
  grainDataUrl,
  mountainLayer,
  nightSky,
} from "@/lib/scenes/heights";
import { createOcean } from "@/lib/scenes/ocean";
import { createSphere } from "@/lib/scenes/sphere";
import { type Issue } from "@/lib/issues";
import { meetingDay, meetingMonth, pitchMeeting } from "@/lib/pitchMeeting";
import BootLine from "./BootLine";
import styles from "./Landing.module.css";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const between = (p: number, a: number, b: number) =>
  smooth(clamp((p - a) / (b - a)));

// The world, top to bottom, in screen-heights.
const SPHERE_Y = 0.5;
const NIGHT = [0.8, 2.6]; // the painted milky way
const CLOUDS = [3.5, 5.0];
const SURFACE = 5.8; // the foot of the mountains, and the sea
const WORLD = 8.0;

// Where the camera's top edge sits (in screen-heights) as you scroll from 0 to 1.
// Phones and tablets get CAMERA_TOUCH instead (below).
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

// On a touchscreen the pause at the foot of the mountains is much shorter, and
// the dive into the sea comes sooner: a finger moves the page less per swipe
// than a mouse wheel, so a long pause felt like the page had stopped responding.
const CAMERA_TOUCH: [number, number][] = [
  [0, 0],
  [0.16, 0],
  [0.24, 1.0],
  [0.34, 1.0],
  [0.58, 5.15],
  [0.6, 5.15],
  [0.7, 6.9],
  [1, 6.9],
];

// When each card shows: [fade in from, fully in, start fading, gone]
const CARDS = {
  title: [-1, 0, 0.05, 0.09],
  issues: [0.24, 0.27, 0.34, 0.38],
  pitch: [0.76, 0.8, 1.1, 1.2],
} as const;
const CARDS_TOUCH = { ...CARDS, pitch: [0.7, 0.74, 1.1, 1.2] } as const;

const code = (n: number) => String(n).padStart(3, "0");
const tag = (season: string) => season.replace(/\s+/g, "").toUpperCase();

function cameraAt(p: number, path: [number, number][]) {
  for (let i = 1; i < path.length; i++) {
    const [p1, c1] = path[i];
    const [p0, c0] = path[i - 1];
    if (p <= p1)
      return c0 + (c1 - c0) * smooth(clamp((p - p0) / (p1 - p0 || 1)));
  }
  return path[path.length - 1][1];
}

/**
 * The landing page: the journey. It opens on the sphere, which shrinks away
 * into a star in the night sky, where the issues are. Scroll on down through a
 * long evening sky and its clouds, past painted mountains, and into the sea
 * with the fish, where this month's pitch meeting is.
 */
export default function Landing({ issues }: { issues: Issue[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const grainEl = wrap.querySelector<HTMLElement>("[data-grain]");
    if (grainEl) grainEl.style.backgroundImage = `url(${grainDataUrl()})`;
    const cards = new Map<string, HTMLElement>();
    wrap
      .querySelectorAll<HTMLElement>("[data-card]")
      .forEach((el) => cards.set(el.dataset.card!, el));

    const touch = window.matchMedia(
      "(hover: none) and (pointer: coarse)",
    ).matches;
    const camera = touch ? CAMERA_TOUCH : CAMERA;
    const cardTimes = touch ? CARDS_TOUCH : CARDS;
    // the issues and pitch meeting cards, drawn as dots (see lib/scenes/particleCard.ts)
    const stage = canvasRef.current!.parentElement!;
    const dotCards = new Map<string, ParticleCard>([
      ["issues", createParticleCard()],
      ["pitch", createParticleCard()],
    ]);
    let dotsBuiltFor = "";
    let fontsReady = false;
    void document.fonts.ready.then(() => (fontsReady = true));
    const buildDots = () => {
      const box = stage.getBoundingClientRect();
      for (const [key, pc] of dotCards) {
        const el = cards.get(key);
        if (el) pc.build(el, box, 1);
      }
      wrap.classList.add(styles.dotMode);
      dotsBuiltFor = `${Math.round(box.width)}x${Math.round(box.height)}`;
    };
    // the pointer anywhere over the stage (the cards sit on top of the canvas)
    const finger = { x: -9999, y: -9999, inside: false };
    const onMove = (e: PointerEvent) => {
      const box = stage.getBoundingClientRect();
      finger.x = e.clientX - box.left;
      finger.y = e.clientY - box.top;
      finger.inside = finger.x >= 0 && finger.y >= 0 && finger.x <= box.width && finger.y <= box.height;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") finger.inside = false;
    };
    const onLeave = () => (finger.inside = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    const ocean = createOcean();
    const sphere = createSphere();
    let skyGrad: CanvasGradient | null = null;
    let rayGrad: CanvasGradient | null = null;
    let builtFor = "";
    let mountains: HTMLCanvasElement[] = [];
    let banks: {
      img: HTMLCanvasElement;
      x: number;
      y: number;
      depth: number;
      drift: number;
    }[] = [];
    let night: HTMLCanvasElement | null = null;
    let stars: { x: number; y: number; r: number; p: number }[] = [];

    const build = (w: number, h: number) => {
      ocean.resize(w, SURFACE * h, WORLD * h);
      const mw = Math.ceil(w * 1.1);
      mountains = [
        mountainLayer(
          mw,
          h * 0.5,
          1,
          {
            dark: "#7d8ab8",
            mid: "#95a2cc",
            light: "#b9c4e6",
            snow: "#e2e8f8",
            snowShade: "#aeb8dc",
            haze: "169,184,242",
            hazeAmount: 0.4,
          },
          { peaks: 6, snow: 0.35 },
        ),
        mountainLayer(
          mw,
          h * 0.44,
          2,
          {
            dark: "#4f5c88",
            mid: "#6b78a6",
            light: "#9aa7cc",
            snow: "#e6ecf8",
            snowShade: "#a2adcf",
            haze: "130,150,225",
            hazeAmount: 0.22,
          },
          { peaks: 5, snow: 0.4 },
        ),
        mountainLayer(
          mw,
          h * 0.66,
          3,
          {
            dark: "#252c44",
            mid: "#3e4866",
            light: "#7e8aa8",
            snow: "#eef2fa",
            snowShade: "#a8b3ce",
            haze: "100,120,200",
            hazeAmount: 0.04,
          },
          { peaks: 3, dominant: true, snow: 0.55 },
        ),
        mountainLayer(
          mw,
          h * 0.2,
          4,
          {
            dark: "#131a2d",
            mid: "#202943",
            light: "#45536f",
            snow: "#c4cee4",
            snowShade: "#6d7a98",
            haze: "0,0,0",
            hazeAmount: 0,
          },
          { peaks: 6, snow: 0.2 },
        ),
      ];
      const rand = seeded(4);
      // on a narrow phone screen the clouds are wider (relative to the screen)
      // and kept to the same shape as on a computer, so they aren't squeezed and cut off
      const cloudW = w < 700 ? w * 0.95 : Math.min(w * 0.6, 760);
      const cloudH = w < 700 ? Math.min(h * 0.42, cloudW * 0.5) : h * 0.42;
      banks = Array.from({ length: 5 }, (_, i) => ({
        img: cloudBank(cloudW, cloudH, 10 + i),
        x: (i % 2 ? w * 0.55 : 0) + rand() * w * 0.3,
        y: h * (CLOUDS[0] + (i / 4) * (CLOUDS[1] - CLOUDS[0])),
        depth: 0.3 + rand() * 0.6,
        drift: 6 + rand() * 10,
      }));
      night = nightSky(w, h * (NIGHT[1] - NIGHT[0]), 6);
      // soften the top and bottom of the milky way, so on a tall phone screen
      // it fades out instead of stopping at a hard line
      {
        const g = night.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        const fade = g.createLinearGradient(0, 0, 0, night.height);
        fade.addColorStop(0, "rgba(0,0,0,0)");
        fade.addColorStop(0.15, "rgba(0,0,0,1)");
        fade.addColorStop(0.8, "rgba(0,0,0,1)");
        fade.addColorStop(1, "rgba(0,0,0,0)");
        g.globalCompositeOperation = "destination-in";
        g.fillStyle = fade;
        g.fillRect(0, 0, night.width, night.height);
        g.globalCompositeOperation = "source-over";
      }
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

    const stop = runCanvas(
      canvasRef.current!,
      (f) => {
        const { ctx, w, h, t, dt, pointer } = f;
        if (builtFor !== `${w}x${h}`) build(w, h);
        const at = (y: number) => y * h;
        const r = wrap.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - window.innerHeight + 56));
        const cam = cameraAt(p, camera) * h;
        const wp = { x: pointer.x, y: pointer.y + cam, inside: pointer.inside };
        const lean = pointer.inside ? pointer.x / w - 0.5 : 0;
        const visible = (y0: number, y1: number) => y1 > cam && y0 < cam + h;

        ctx.save();
        ctx.translate(0, -cam);

        // one long gradient, from the sphere's deep space down to the deep sea
        if (!skyGrad) {
          skyGrad = ctx.createLinearGradient(0, 0, 0, at(WORLD));
          const stop = (y: number, c: string) =>
            skyGrad!.addColorStop(y / WORLD, c);
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
            const near = wp.inside
              ? Math.max(0, 1 - Math.hypot(s.x - wp.x, s.y - wp.y) / 140)
              : 0;
            // stars fade out as the sky brightens further down
            const sky = 1 - clamp((s.y / h - 2.4) / 0.9);
            ctx.globalAlpha =
              (0.35 + 0.35 * Math.sin(t * 1.4 + s.p) + near * 0.5) * sky;
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
          const x =
            ((b.x + t * b.drift - lean * 40 * b.depth) % (w + bw)) - bw * 0.5;
          ctx.globalAlpha = 0.97;
          ctx.drawImage(b.img, x, b.y - b.img.height * 0.72);
        }
        ctx.globalAlpha = 1;

        // ---- the mountains, far to near, with a little parallax
        if (visible(at(SURFACE - 0.85), at(SURFACE + 0.05))) {
          mountains.forEach((m, i) => {
            ctx.drawImage(
              m,
              -w * 0.05 - lean * 12 * (i + 1),
              at(SURFACE) - m.height + 2,
            );
          });
        }

        // ---- the waterline
        ctx.fillStyle = "rgba(220,230,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(0, at(SURFACE));
        for (let x = 0; x <= w; x += 12)
          ctx.lineTo(x, at(SURFACE) + Math.sin(x * 0.03 + t * 1.6) * 3);
        ctx.lineTo(w, at(SURFACE) + 6);
        ctx.lineTo(0, at(SURFACE) + 6);
        ctx.fill();

        // ---- the deep: light rays and the fish
        if (visible(at(SURFACE), at(WORLD))) {
          if (!rayGrad) {
            rayGrad = ctx.createLinearGradient(
              0,
              at(SURFACE),
              0,
              at(SURFACE + 1.3),
            );
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
          sphere.draw(f, {
            cx: w / 2,
            cy: sy,
            radius: R,
            background: false,
            alpha: 1 - between(p, 0.14, 0.17),
          });
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
        const useDots = !f.reduced && fontsReady;
        if (useDots) {
          const sb = stage.getBoundingClientRect();
          if (dotsBuiltFor !== `${Math.round(sb.width)}x${Math.round(sb.height)}`) buildDots();
        }
        for (const [key, [a, b, c, d]] of Object.entries(cardTimes)) {
          const el = cards.get(key);
          if (!el) continue;
          const o = between(p, a, b) * (1 - between(p, c, d));
          const pc = dotCards.get(key);
          if (pc && useDots) {
            // the dots gather over a stretch of scrolling, then blow apart as you scroll on
            pc.step(dt, between(p, a, b + (b - a) * 0.6), between(p, c, d), finger);
            pc.draw(ctx);
            el.style.opacity = "1";
          } else {
            el.style.opacity = String(o);
            el.style.transform = `translateY(${(1 - o) * 24}px)`;
          }
          el.style.visibility = o < 0.01 ? "hidden" : "visible";
        }
      },
      { maxDpr: touch ? 1.5 : 2 },
    );
    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.journeyWrap}>
      <div className={styles.diveStage}>
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${styles.scrollCanvas}`}
          aria-hidden="true"
        />
        <div data-grain className={styles.grain} aria-hidden="true" />
        <div className={styles.overlay}>
          <BootLine text="> sci_sphere.sys // online" />
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

        <section
          data-card="pitch"
          className={styles.card}
          aria-label="This month's pitch meeting"
        >
          <p className="label" data-dots="dim">
            specimen {"//"} pitch_meeting {"//"}{" "}
            {meetingMonth(pitchMeeting.date)}
          </p>
          <h2 data-dots="text">This month&apos;s pitch meeting</h2>
          <dl>
            <dt className="label" data-dots="dim">day</dt>
            <dd data-dots="text">{meetingDay(pitchMeeting.date)}</dd>
            <dt className="label" data-dots="dim">time</dt>
            <dd data-dots="text">{pitchMeeting.time}</dd>
            <dt className="label" data-dots="dim">where</dt>
            <dd data-dots="text">{pitchMeeting.where}</dd>
          </dl>
          <div className={styles.cardButtons}>
            {pitchMeeting.rsvpUrl ? (
              <a
                href={pitchMeeting.rsvpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardButton}
                data-dots="button"
              >
                RSVP ↗
              </a>
            ) : (
              <span
                className={`${styles.cardButton} ${styles.cardButtonOff}`}
                aria-disabled="true"
                data-dots="button"
              >
                RSVP opens soon
              </span>
            )}
            <Link
              href="/pitch"
              className={`${styles.cardButton} ${styles.cardButtonGhost}`}
              data-dots="button"
            >
              Pitch a story →
            </Link>
          </div>
        </section>

        <section
          data-card="issues"
          className={styles.card}
          aria-label="Issues"
        >
          <p className="label" data-dots="dim">
            archive log {"//"} {issues.length} issues
          </p>
          <h2 data-dots="text">The issues</h2>
          <ul className={styles.issueList}>
            {[...issues]
              .sort((a, b) => b.number - a.number)
              .map((i) => (
                <li key={i.id}>
                  <Link href={`/issues/${i.number}`} data-dots="text">
                    issue_{code(i.number)} {"//"} {tag(i.season)}
                  </Link>
                </li>
              ))}
          </ul>
          <Link
            href="/issues"
            className={`${styles.cardButton} ${styles.cardButtonGhost}`}
            data-dots="button"
          >
            Open the archive →
          </Link>
        </section>
      </div>
    </div>
  );
}
