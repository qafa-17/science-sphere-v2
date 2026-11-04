"use client";

import { useEffect, useRef, useState } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import { createCircuit } from "@/lib/scenes/circuit";
import { createSky } from "@/lib/scenes/sky";
import { createSphere } from "@/lib/scenes/sphere";
import styles from "./Lab.module.css";

const WORLDS = ["Sky", "Sphere", "Circuit"];
const DURATION = 1.9; // seconds for a morph
const STAY = 7; // seconds before it moves on by itself
const DOTS = 170;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Prototype 05: the three worlds are made of the same dots. Stars gather into
 * the sphere, the sphere flattens into the circuit's pads, and the pads scatter
 * back into stars. It moves on every few seconds, on a tap, or from the buttons.
 */
export default function Morph() {
  const ref = useRef<HTMLCanvasElement>(null);
  const goRef = useRef<(i: number) => void>(() => {});
  const [world, setWorld] = useState(0);

  useEffect(() => {
    const sky = createSky();
    const sphere = createSphere();
    const circuit = createCircuit();
    const scenes = [sky, sphere, circuit];
    const rand = seeded(31);
    const delays = Array.from({ length: DOTS }, () => rand() * 0.45);

    let from = 0;
    let to = 0;
    let started = 0; // time the current morph began (the first one fades the sky in)
    let lastTap = -1;
    let now = 0;
    // where each dot starts, fixed when a morph begins
    let starts: { x: number; y: number }[] = [];

    const pointsOf = (i: number) => scenes[i].points();
    const go = (next: number) => {
      if (next === to) return;
      const src = pointsOf(to);
      starts = Array.from({ length: DOTS }, (_, k) => src[k % src.length] ?? { x: 0, y: 0 });
      from = to;
      to = next;
      started = now;
      setWorld(next);
    };
    goRef.current = go;

    return runCanvas(
      ref.current!,
      (f) => {
        const { ctx, w, h, t, taps } = f;
        now = t;
        // a tap, or enough time, moves to the next world
        const tap = taps[taps.length - 1];
        if (tap && tap.t !== lastTap) {
          lastTap = tap.t;
          go((to + 1) % 3);
        } else if (t - started > STAY + DURATION && !f.reduced) go((to + 1) % 3);

        const k = clamp((t - started) / DURATION);
        const e = ease(k);
        ctx.fillStyle = "#0D0630";
        ctx.fillRect(0, 0, w, h);
        // the old world fades out and the new one in, dimmed while the dots travel
        const travelling = k > 0 && k < 1;
        const opts = (i: number, a: number) => (i === 2 ? { alpha: a, grow: i === to ? clamp((k - 0.4) / 0.6) : 1 } : { alpha: a });
        if (from !== to && travelling) scenes[from].draw(f, opts(from, (1 - e) * 0.9));
        scenes[to].draw(f, opts(to, travelling ? e : 1));

        // the travelling dots
        if (travelling && from !== to) {
          const targets = pointsOf(to);
          const fade = Math.min(1, k * 6, (1 - k) * 4);
          for (let i = 0; i < DOTS; i++) {
            const d = delays[i];
            const q = ease(clamp((k - d) / (1 - d)));
            const a = starts[i];
            const b = targets[i % targets.length] ?? a;
            // a little arc, so they swirl rather than slide
            const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18;
            const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;
            const x = (1 - q) * (1 - q) * a.x + 2 * (1 - q) * q * mx + q * q * b.x;
            const y = (1 - q) * (1 - q) * a.y + 2 * (1 - q) * q * my + q * q * b.y;
            ctx.fillStyle = `rgba(230,249,175,${0.85 * fade})`;
            // square like a pixel star when near the sky, round otherwise
            const sq = (from === 0 && q < 0.5) || (to === 0 && q > 0.5);
            if (sq) ctx.fillRect(x - 2, y - 2, 4, 4);
            else {
              ctx.beginPath();
              ctx.arc(x, y, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
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
    <>
      <canvas
        ref={ref}
        className={styles.canvas}
        aria-label="Three worlds made of the same dots: a night sky, a sphere and a circuit board"
        role="img"
      />
      <div className={styles.worlds} role="group" aria-label="Choose a world">
        {WORLDS.map((name, i) => (
          <button key={name} type="button" aria-pressed={world === i} onClick={() => goRef.current(i)}>
            0{i + 1} {name}
          </button>
        ))}
      </div>
    </>
  );
}
