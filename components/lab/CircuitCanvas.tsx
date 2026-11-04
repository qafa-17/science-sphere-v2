"use client";

import { useEffect, useRef } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import styles from "./Lab.module.css";

type Trace = {
  pts: { x: number; y: number }[];
  /** total length in px, and the length at each point */
  len: number;
  at: number[];
  fromChip: boolean;
  end: "dot" | "ring" | "pad";
  pulses: number[]; // positions along the trace, in px
  lit: number; // 0..1, eased
};

const DIRS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

/**
 * Prototype 03: a circuit board around a big version of the CPU cursor.
 * Signals pulse out along the traces; traces near the cursor light up and
 * fire toward it, and the nearest pad links to it. A tap fires every trace.
 */
export default function CircuitCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let traces: Trace[] = [];
    let G = 22;
    let chip = { x: 0, y: 0, half: 0 };
    let flash = 0;
    let lastBurst = -1;

    const build = (w: number, h: number) => {
      const rand = seeded(23);
      G = w < 700 ? 18 : 22;
      const cols = Math.ceil(w / G) + 1;
      const rows = Math.ceil(h / G) + 1;
      const used = new Uint8Array(cols * rows);
      const take = (c: number, r: number) => {
        if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
        if (used[r * cols + c]) return false;
        used[r * cols + c] = 1;
        return true;
      };
      const cc = Math.round(cols / 2);
      const cr = Math.round(rows / 2.1);
      const halfCells = w < 700 ? 2 : 3;
      chip = { x: cc * G, y: cr * G, half: halfCells * G + 6 };
      // keep the chip's own cells clear
      for (let r = cr - halfCells - 1; r <= cr + halfCells + 1; r++)
        for (let c = cc - halfCells - 1; c <= cc + halfCells + 1; c++) if (c >= 0 && r >= 0 && c < cols && r < rows) used[r * cols + c] = 1;

      const walk = (c: number, r: number, dir: number, maxSteps: number, fromChip: boolean, start?: { x: number; y: number }) => {
        const pts = start ? [start, { x: c * G, y: r * G }] : [{ x: c * G, y: r * G }];
        let steps = 0;
        let straight = 0;
        while (steps < maxSteps) {
          // mostly keep going; sometimes bend 45 degrees, then come back
          let next = dir;
          if (straight > 2 && rand() < 0.22) next = (dir + (rand() < 0.5 ? 1 : 7)) % 8;
          const [dx, dy] = DIRS[next];
          if (!take(c + dx, r + dy)) {
            const [ax, ay] = DIRS[dir];
            if (next !== dir && take(c + ax, r + ay)) {
              c += ax;
              r += ay;
            } else break;
          } else {
            c += dx;
            r += dy;
            if (next !== dir) {
              // after a diagonal step, turn back to straight half the time
              dir = rand() < 0.5 ? next : dir;
              straight = 0;
            }
          }
          straight++;
          const last = pts[pts.length - 1];
          const prev = pts[pts.length - 2];
          const p = { x: c * G, y: r * G };
          // merge points that continue in the same direction
          if (prev && Math.sign(p.x - last.x) === Math.sign(last.x - prev.x) && Math.sign(p.y - last.y) === Math.sign(last.y - prev.y)) pts[pts.length - 1] = p;
          else pts.push(p);
          steps++;
        }
        if (pts.length < 2 || steps < 3) return;
        const at = [0];
        for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
        const r3 = rand();
        traces.push({
          pts,
          at,
          len: at[at.length - 1],
          fromChip,
          end: r3 < 0.45 ? "dot" : r3 < 0.75 ? "ring" : "pad",
          pulses: [],
          lit: 0,
        });
      };

      traces = [];
      // traces leaving the chip's pins on all four sides
      for (let k = -halfCells; k <= halfCells; k++) {
        const len = () => 6 + Math.floor(rand() * 26);
        walk(cc + k, cr - halfCells - 2, 6, len(), true, { x: (cc + k) * G, y: chip.y - chip.half });
        walk(cc + k, cr + halfCells + 2, 2, len(), true, { x: (cc + k) * G, y: chip.y + chip.half });
        walk(cc - halfCells - 2, cr + k, 4, len(), true, { x: chip.x - chip.half, y: (cr + k) * G });
        walk(cc + halfCells + 2, cr + k, 0, len(), true, { x: chip.x + chip.half, y: (cr + k) * G });
      }
      // background traces filling the rest of the board
      for (let i = 0; i < 260; i++) {
        const c = Math.floor(rand() * cols);
        const r = Math.floor(rand() * rows);
        if (!take(c, r)) continue;
        walk(c, r, Math.floor(rand() * 4) * 2, 4 + Math.floor(rand() * 14), false);
      }
    };

    const pointAt = (tr: Trace, d: number) => {
      let i = 1;
      while (i < tr.at.length - 1 && tr.at[i] < d) i++;
      const a = tr.pts[i - 1];
      const b = tr.pts[i];
      const seg = tr.at[i] - tr.at[i - 1] || 1;
      const k = Math.min(1, Math.max(0, (d - tr.at[i - 1]) / seg));
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    };

    const distTo = (tr: Trace, x: number, y: number) => {
      let best = Infinity;
      for (let i = 1; i < tr.pts.length; i++) {
        const a = tr.pts[i - 1];
        const b = tr.pts[i];
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const l2 = vx * vx + vy * vy || 1;
        const k = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / l2));
        best = Math.min(best, Math.hypot(a.x + vx * k - x, a.y + vy * k - y));
      }
      return best;
    };

    return runCanvas(
      canvas,
      ({ ctx, w, h, t, dt, pointer, taps, reduced }) => {
        // board
        ctx.fillStyle = "#18314F";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(139,190,178,0.12)";
        for (let y = 0; y < h; y += G) for (let x = 0; x < w; x += G) ctx.fillRect(x - 0.5, y - 0.5, 1, 1);

        // a tap fires every trace
        const newest = taps[taps.length - 1];
        if (newest && newest.t !== lastBurst) {
          lastBurst = newest.t;
          flash = 1;
          for (const tr of traces) if (tr.fromChip || Math.hypot(tr.pts[0].x - newest.x, tr.pts[0].y - newest.y) < 260) tr.pulses.push(0);
        }
        flash = Math.max(0, flash - dt * 1.5);

        // which pad is nearest the cursor
        let probe: { x: number; y: number; d: number } | null = null;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const tr of traces) {
          const d = pointer.inside ? distTo(tr, pointer.x, pointer.y) : Infinity;
          const target = Math.max(0, 1 - d / 110);
          tr.lit += (target - tr.lit) * Math.min(1, dt * 8);

          // spawn signals: always a few from the chip, more on lit traces
          if (!reduced) {
            const rate = (tr.fromChip ? 0.18 : 0.03) + tr.lit * 2.2;
            if (Math.random() < rate * dt) tr.pulses.push(0);
          }
          const speed = 240 + tr.lit * 160;
          tr.pulses = tr.pulses.map((p) => p + speed * dt).filter((p) => p < tr.len + 20);

          // the trace itself
          const base = tr.fromChip ? 0.55 : 0.28;
          ctx.strokeStyle = tr.lit > 0.02 ? `rgba(230,249,175,${base + tr.lit * 0.45})` : `rgba(139,190,178,${base})`;
          ctx.lineWidth = tr.fromChip ? 1.6 : 1.1;
          ctx.beginPath();
          ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
          for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i].x, tr.pts[i].y);
          ctx.stroke();

          // the end pad
          const e = tr.pts[tr.pts.length - 1];
          const padCol = tr.lit > 0.05 ? `rgba(230,249,175,${0.6 + tr.lit * 0.4})` : tr.fromChip ? "rgba(202,172,75,0.85)" : "rgba(139,190,178,0.5)";
          if (tr.end === "ring") {
            ctx.strokeStyle = padCol;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 3.4, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = padCol;
            if (tr.end === "pad") ctx.fillRect(e.x - 3.5, e.y - 3.5, 7, 7);
            else {
              ctx.beginPath();
              ctx.arc(e.x, e.y, 2.6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          if (pointer.inside) {
            const pd = Math.hypot(e.x - pointer.x, e.y - pointer.y);
            if (pd < 170 && (!probe || pd < probe.d)) probe = { x: e.x, y: e.y, d: pd };
          }

          // the signals
          for (const p of tr.pulses) {
            const head = pointAt(tr, Math.min(p, tr.len));
            const tail = pointAt(tr, Math.max(0, p - 26));
            const g = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
            g.addColorStop(0, "rgba(230,249,175,0)");
            g.addColorStop(1, "rgba(230,249,175,0.95)");
            ctx.strokeStyle = g;
            ctx.lineWidth = tr.fromChip ? 2.6 : 2;
            ctx.beginPath();
            ctx.moveTo(tail.x, tail.y);
            ctx.lineTo(head.x, head.y);
            ctx.stroke();
          }
        }

        // the probe: a dashed line from the nearest pad to the cursor
        if (probe) {
          const k = 1 - probe.d / 170;
          ctx.setLineDash([3, 4]);
          ctx.strokeStyle = `rgba(202,172,75,${0.9 * k})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(probe.x, probe.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = `rgba(230,249,175,${0.25 * k})`;
          ctx.beginPath();
          ctx.arc(probe.x, probe.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        drawChip(ctx, chip.x, chip.y, chip.half, G, flash);
        void t;
      },
      { onResize: build },
    );
  }, []);

  return <canvas ref={ref} className={styles.canvas} aria-label="A circuit board with signals running along it" role="img" />;
}

/** The big CPU: the same design as the cursor. */
function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, G: number, flash: number) {
  const lime = `rgba(230,249,175,1)`;
  // pins
  ctx.fillStyle = lime;
  const n = Math.round((half - 6) / G);
  for (let k = -n; k <= n; k++) {
    const p = k * G;
    ctx.fillRect(x + p - 3, y - half - 7, 6, 9);
    ctx.fillRect(x + p - 3, y + half - 2, 6, 9);
    ctx.fillRect(x - half - 7, y + p - 3, 9, 6);
    ctx.fillRect(x + half - 2, y + p - 3, 9, 6);
  }
  // body
  ctx.fillStyle = flash > 0 ? `rgba(${13 + flash * 60},${6 + flash * 80},${48 + flash * 40},1)` : "#0D0630";
  ctx.strokeStyle = lime;
  ctx.lineWidth = 3;
  roundRect(ctx, x - half, y - half, half * 2, half * 2, 8);
  ctx.fill();
  ctx.stroke();
  // die
  ctx.lineWidth = 1.5;
  const d = half * 0.62;
  roundRect(ctx, x - d, y - d, d * 2, d * 2, 3);
  ctx.stroke();
  // pin-1 mark and label
  ctx.beginPath();
  ctx.arc(x - d + 10, y - d + 10, 3, 0, Math.PI * 2);
  ctx.fillStyle = lime;
  ctx.fill();
  ctx.font = `700 ${Math.max(9, half * 0.13)}px "Space Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCI_SPHERE", x, y + 2);
  ctx.globalAlpha = 0.6;
  ctx.font = `${Math.max(8, half * 0.1)}px "Space Mono", monospace`;
  ctx.fillText("MRU-003", x, y + half * 0.28);
  ctx.globalAlpha = 1;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
