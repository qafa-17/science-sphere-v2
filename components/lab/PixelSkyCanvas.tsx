"use client";

import { useEffect, useRef } from "react";
import { runCanvas, seeded } from "@/lib/canvasLoop";
import styles from "./Lab.module.css";

// colours, as [r, g, b]
const AMETHYST = [13, 6, 48];
const DEEP = [24, 49, 79];
const TEAL = [139, 190, 178];
const LIME = [230, 249, 175];
const GOLD = [202, 172, 75];
const ROOF = [8, 5, 26];

function mix(a: number[], b: number[], k: number) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

const SKY = [AMETHYST, mix(AMETHYST, DEEP, 0.5), DEEP, mix(DEEP, TEAL, 0.3)];

// a 4x4 Bayer matrix, for the dithered pixel-art look
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/**
 * Prototype 02: a pixel-art night sky. Clouds drift past, stars twinkle, and
 * rooftops sit along the bottom. The cursor is a lantern: clouds part around
 * it and the pixels near it glow. A tap sends a ripple of light outward.
 */
export default function PixelSkyCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const off = document.createElement("canvas");
    const octx = off.getContext("2d")!;
    let px = 6; // screen pixels per sky pixel
    let gw = 0;
    let gh = 0;
    let img: ImageData | null = null;
    let roofline: number[] = [];
    let stars: { x: number; y: number; p: number; big: boolean }[] = [];
    let wires: { x0: number; x1: number; y: number; sag: number }[] = [];

    // smooth value noise for the clouds
    const perm = new Uint8Array(512);
    {
      const r = seeded(5);
      const p = Array.from({ length: 256 }, (_, i) => i);
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    }
    const hash = (x: number, y: number) => perm[(perm[x & 255] + y) & 511] / 255;
    const noise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi);
      const b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1);
      const d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const fbm = (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;

    const build = (w: number, h: number) => {
      px = w < 700 ? 5 : 6;
      gw = Math.ceil(w / px);
      gh = Math.ceil(h / px);
      off.width = gw;
      off.height = gh;
      img = octx.createImageData(gw, gh);
      const r = seeded(11);
      // rooftops: blocks of different heights, some with antennas
      roofline = new Array(gw).fill(0);
      let x = 0;
      while (x < gw) {
        const bw = 10 + Math.floor(r() * 26);
        const bh = Math.floor(gh * (0.06 + r() * 0.1));
        for (let i = x; i < Math.min(gw, x + bw); i++) roofline[i] = bh;
        if (r() < 0.5) {
          const ax = x + 2 + Math.floor(r() * (bw - 4));
          if (ax < gw) roofline[ax] = bh + 4 + Math.floor(r() * 6);
        }
        x += bw;
      }
      // power lines hang between poles
      wires = [];
      const span = 70;
      for (let x0 = 6; x0 < gw; x0 += span) {
        for (let k = 0; k < 2; k++) wires.push({ x0, x1: x0 + span, y: gh - Math.floor(gh * 0.2) + k * 3, sag: 4 + k });
      }
      stars = Array.from({ length: Math.floor((gw * gh) / 260) }, () => ({
        x: Math.floor(r() * gw),
        y: Math.floor(r() * gh * 0.7),
        p: r() * 6.28,
        big: r() < 0.12,
      }));
    };

    return runCanvas(
      canvas,
      ({ ctx, w, h, t, pointer, taps, reduced }) => {
        if (!img) return;
        const data = img.data;
        const time = reduced ? 0 : t;
        const mx = pointer.inside ? pointer.x / px : -999;
        const my = pointer.inside ? pointer.y / px : -999;
        const lamp = 26; // lantern radius, in sky pixels

        for (let y = 0; y < gh; y++) {
          const fy = y / gh;
          for (let x = 0; x < gw; x++) {
            const bay = BAYER[(y & 3) * 4 + (x & 3)];
            // sky: amethyst at the top down to deep blue and a hint of teal,
            // dithered between the steps like old pixel art
            let c: number[];
            const g = fy * (SKY.length - 1);
            const i0 = Math.min(SKY.length - 2, Math.floor(g));
            c = g - i0 > bay ? SKY[i0 + 1] : SKY[i0];

            // distance to the lantern
            const d = Math.hypot(x - mx, y - my);
            const lit = Math.max(0, 1 - d / lamp);

            // clouds, thinning out around the lantern
            const n = fbm(x * 0.026 + time * 0.04, y * 0.07 + 3.7) - lit * 0.4;
            const cloudLine = 0.62 - fy * 0.06;
            if (n > cloudLine) {
              const depth = n - cloudLine;
              if (depth > 0.12 + bay * 0.04) c = mix(TEAL, LIME, 0.55);
              else if (depth > 0.05 + bay * 0.04) c = TEAL;
              else c = mix(DEEP, TEAL, 0.55);
            }

            // ripples from taps
            let ring = 0;
            for (const tap of taps) {
              const age = Math.max(0, t - tap.t);
              const rd = Math.hypot(x - tap.x / px, y - tap.y / px);
              ring = Math.max(ring, Math.max(0, 1 - Math.abs(rd - age * 70) / 3) * Math.max(0, 1 - age / 1.8));
            }

            // lantern glow, stepped and dithered like pixel art
            const glow = lit * lit * 0.7 + ring * 0.8;
            if (glow > bay * 0.9) c = mix(c, LIME, Math.min(0.6, glow));

            // rooftops along the bottom
            if (gh - y <= roofline[x]) c = ROOF;

            const o = (y * gw + x) * 4;
            data[o] = c[0];
            data[o + 1] = c[1];
            data[o + 2] = c[2];
            data[o + 3] = 255;
          }
        }

        // power lines and their poles
        for (const wire of wires) {
          for (let x = wire.x0; x <= wire.x1 && x < gw; x++) {
            const k = ((x - wire.x0) / (wire.x1 - wire.x0)) * 2 - 1;
            const y = Math.round(wire.y + wire.sag * (1 - k * k));
            if (y >= 0 && y < gh && gh - y > roofline[x]) set(data, gw, x, y, ROOF);
          }
          for (let y = wire.y - 2; y < gh; y++) set(data, gw, wire.x0, y, ROOF);
        }

        // stars twinkle, and brighten near the lantern
        for (const s of stars) {
          const d = Math.hypot(s.x - mx, s.y - my);
          const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.p);
          const on = tw > 0.35 || d < lamp;
          if (!on) continue;
          const col = d < lamp ? LIME : s.big ? GOLD : mix(TEAL, LIME, 0.6);
          set(data, gw, s.x, s.y, col);
          if (s.big || d < lamp * 0.6) {
            set(data, gw, s.x + 1, s.y, col);
            set(data, gw, s.x - 1, s.y, col);
            set(data, gw, s.x, s.y + 1, col);
            set(data, gw, s.x, s.y - 1, col);
          }
        }

        // the moon
        const moonX = Math.floor(gw * 0.78);
        const moonY = Math.floor(gh * 0.18);
        for (let y = -4; y <= 4; y++)
          for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) set(data, gw, moonX + x, moonY + y, x + y > 2 ? TEAL : LIME);

        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, gw * px, gh * px);
        void w;
        void h;
      },
      { maxDpr: 1, onResize: build },
    );
  }, []);

  return <canvas ref={ref} className={`${styles.canvas} ${styles.pixel}`} aria-label="A pixel-art night sky" role="img" />;
}

function set(data: Uint8ClampedArray, gw: number, x: number, y: number, c: number[]) {
  if (x < 0 || x >= gw || y < 0) return;
  const o = (y * gw + x) * 4;
  if (o + 3 >= data.length) return;
  data[o] = c[0];
  data[o + 1] = c[1];
  data[o + 2] = c[2];
}
