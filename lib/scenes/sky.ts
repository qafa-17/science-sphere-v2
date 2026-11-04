// The pixel-art night sky (prototype 02), as a scene that can zoom toward its moon and fade.
import { type Frame, seeded } from "../canvasLoop";

type C = number[];
const AMETHYST = [13, 6, 48];
const DEEP = [24, 49, 79];
const TEAL = [139, 190, 178];
const LIME = [230, 249, 175];
const GOLD = [202, 172, 75];
const ROOF = [8, 5, 26];
const mix = (a: C, b: C, k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const SKY = [AMETHYST, mix(AMETHYST, DEEP, 0.5), DEEP, mix(DEEP, TEAL, 0.3)];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export type SkyOpts = {
  alpha?: number;
  /** 1 = normal; bigger zooms in toward the moon */
  zoom?: number;
  /** hide the moon (when something else takes its place) */
  hideMoon?: boolean;
  /** move the whole sky by this much (px), e.g. to bring the moon to the middle */
  shift?: { x: number; y: number };
};

export function createSky() {
  const off = document.createElement("canvas");
  const octx = off.getContext("2d")!;
  let px = 6;
  let gw = 0;
  let gh = 0;
  let img: ImageData | null = null;
  let roofline: number[] = [];
  let stars: { x: number; y: number; p: number; big: boolean }[] = [];
  let wires: { x0: number; x1: number; y: number; sag: number }[] = [];

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

  const set = (data: Uint8ClampedArray, x: number, y: number, c: C) => {
    if (x < 0 || x >= gw || y < 0 || y >= gh) return;
    const o = (y * gw + x) * 4;
    data[o] = c[0];
    data[o + 1] = c[1];
    data[o + 2] = c[2];
  };

  function resize(w: number, h: number) {
    px = w < 700 ? 5 : 6;
    gw = Math.ceil(w / px);
    gh = Math.ceil(h / px);
    off.width = gw;
    off.height = gh;
    img = octx.createImageData(gw, gh);
    const r = seeded(11);
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
    wires = [];
    for (let x0 = 6; x0 < gw; x0 += 70) {
      for (let k = 0; k < 2; k++) wires.push({ x0, x1: x0 + 70, y: gh - Math.floor(gh * 0.2) + k * 3, sag: 4 + k });
    }
    stars = Array.from({ length: Math.floor((gw * gh) / 260) }, () => ({
      x: Math.floor(r() * gw),
      y: Math.floor(r() * gh * 0.7),
      p: r() * 6.28,
      big: r() < 0.12,
    }));
  }

  /** The moon's centre and radius on screen, at zoom 1. */
  const moon = () => ({ x: Math.floor(gw * 0.78) * px, y: Math.floor(gh * 0.18) * px, r: 4.5 * px });

  function draw(f: Frame, o: SkyOpts = {}) {
    const { ctx, t, pointer, taps, reduced } = f;
    const alpha = o.alpha ?? 1;
    if (!img || alpha <= 0.001) return;
    const zoom = o.zoom ?? 1;
    const sh = o.shift ?? { x: 0, y: 0 };
    const m = moon();
    const data = img.data;
    const time = reduced ? 0 : t;
    // pointer in sky pixels, undoing the zoom
    const mx = pointer.inside ? ((pointer.x - sh.x - m.x) / zoom + m.x) / px : -999;
    const my = pointer.inside ? ((pointer.y - sh.y - m.y) / zoom + m.y) / px : -999;
    const lamp = 26;

    for (let y = 0; y < gh; y++) {
      const fy = y / gh;
      for (let x = 0; x < gw; x++) {
        const bay = BAYER[(y & 3) * 4 + (x & 3)];
        const g = fy * (SKY.length - 1);
        const i0 = Math.min(SKY.length - 2, Math.floor(g));
        let c = g - i0 > bay ? SKY[i0 + 1] : SKY[i0];
        const lit = Math.max(0, 1 - Math.hypot(x - mx, y - my) / lamp);
        const n = fbm(x * 0.026 + time * 0.04, y * 0.07 + 3.7) - lit * 0.4;
        const cloudLine = 0.62 - fy * 0.06;
        if (n > cloudLine) {
          const depth = n - cloudLine;
          if (depth > 0.12 + bay * 0.04) c = mix(TEAL, LIME, 0.55);
          else if (depth > 0.05 + bay * 0.04) c = TEAL;
          else c = mix(DEEP, TEAL, 0.55);
        }
        let ring = 0;
        for (const tap of taps) {
          const age = Math.max(0, t - tap.t);
          const rd = Math.hypot(x - tap.x / px, y - tap.y / px);
          ring = Math.max(ring, Math.max(0, 1 - Math.abs(rd - age * 70) / 3) * Math.max(0, 1 - age / 1.8));
        }
        const glow = lit * lit * 0.7 + ring * 0.8;
        if (glow > bay * 0.9) c = mix(c, LIME, Math.min(0.6, glow));
        if (gh - y <= roofline[x]) c = ROOF;
        const off4 = (y * gw + x) * 4;
        data[off4] = c[0];
        data[off4 + 1] = c[1];
        data[off4 + 2] = c[2];
        data[off4 + 3] = 255;
      }
    }
    for (const wire of wires) {
      for (let x = wire.x0; x <= wire.x1 && x < gw; x++) {
        const k = ((x - wire.x0) / (wire.x1 - wire.x0)) * 2 - 1;
        const y = Math.round(wire.y + wire.sag * (1 - k * k));
        if (gh - y > roofline[x]) set(data, x, y, ROOF);
      }
      for (let y = wire.y - 2; y < gh; y++) set(data, wire.x0, y, ROOF);
    }
    for (const s of stars) {
      const d = Math.hypot(s.x - mx, s.y - my);
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.p);
      if (!(tw > 0.35 || d < lamp)) continue;
      const col = d < lamp ? LIME : s.big ? GOLD : mix(TEAL, LIME, 0.6);
      set(data, s.x, s.y, col);
      if (s.big || d < lamp * 0.6) {
        set(data, s.x + 1, s.y, col);
        set(data, s.x - 1, s.y, col);
        set(data, s.x, s.y + 1, col);
        set(data, s.x, s.y - 1, col);
      }
    }
    if (!o.hideMoon) {
      const cx = Math.floor(gw * 0.78);
      const cy = Math.floor(gh * 0.18);
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) set(data, cx + x, cy + y, x + y > 2 ? TEAL : LIME);
    }
    octx.putImageData(img, 0, 0);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    // zoom in around the moon
    ctx.translate(m.x + sh.x, m.y + sh.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-m.x, -m.y);
    ctx.drawImage(off, 0, 0, gw * px, gh * px);
    ctx.restore();
  }

  /** the stars' screen positions (at zoom 1) */
  const points = () => stars.map((s) => ({ x: s.x * px + px / 2, y: s.y * px + px / 2 }));

  return { draw, resize, moon, points };
}
