// Space, after the poster but painted like the fish: a dark teal sky with soft
// haze, stars of every size, and banded planets with storms, shading, a lit
// rim and speckled surfaces. Each planet is an issue of the magazine.
import { seeded } from "../canvasLoop";
import { CREAM, INK, ORANGE, TEAL } from "./launch";

const SCALE = 2;

export type Planet = {
  x: number;
  y: number;
  r: number;
  ring: boolean;
  label: string;
  href: string;
  hover: number;
  bands: HTMLCanvasElement;
  shade: HTMLCanvasElement;
  ringBack?: HTMLCanvasElement;
  ringFront?: HTMLCanvasElement;
  speed: number;
};

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * SCALE);
  c.height = Math.ceil(h * SCALE);
  const g = c.getContext("2d")!;
  g.scale(SCALE, SCALE);
  return { c, g };
}

/** A strip of wavy bands, twice as wide as the planet, that wraps around seamlessly. */
function bandStrip(r: number, colours: string[], seed: number, storm: boolean) {
  const W = r * 4;
  const H = r * 2;
  const { c, g } = canvas(W, H);
  const rand = seeded(seed);
  const n = colours.length;
  const bh = H / n;
  for (let i = -1; i <= n; i++) {
    const col = colours[(i + n) % n];
    const y0 = i * bh;
    const amp = bh * (0.12 + rand() * 0.12);
    const waves = 2 + Math.floor(rand() * 3); // whole waves across the strip, so it tiles
    const phase = rand() * 6.28;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, y0 + Math.sin(phase) * amp);
    for (let x = 0; x <= W; x += W / 80) g.lineTo(x, y0 + Math.sin((x / W) * waves * 2 * Math.PI + phase) * amp);
    g.lineTo(W, y0 + bh * 1.5);
    g.lineTo(0, y0 + bh * 1.5);
    g.fill();
    // fine streaks inside each band
    g.strokeStyle = "rgba(255,255,255,0.12)";
    g.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const yy = y0 + bh * (0.3 + k * 0.22);
      g.beginPath();
      for (let x = 0; x <= W; x += W / 80) {
        const yv = yy + Math.sin((x / W) * waves * 2 * Math.PI + phase + k) * amp * 0.7;
        if (x === 0) g.moveTo(x, yv);
        else g.lineTo(x, yv);
      }
      g.stroke();
    }
  }
  if (storm) {
    // a great storm, like Jupiter's spot, drawn twice so it wraps
    for (const sx of [W * 0.3, W * 0.3 + W]) {
      const sy = H * 0.64;
      const e = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.32);
      e.addColorStop(0, CREAM);
      e.addColorStop(0.45, "#f0a26c");
      e.addColorStop(0.8, ORANGE);
      e.addColorStop(1, "rgba(226,103,47,0)");
      g.fillStyle = e;
      g.beginPath();
      g.ellipse(sx, sy, r * 0.34, r * 0.16, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(244,234,215,0.7)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(sx, sy, r * 0.24, r * 0.1, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  // speckles all over
  for (let i = 0; i < (W * H) / 60; i++) {
    g.fillStyle = rand() < 0.7 ? "rgba(255,255,255,0.35)" : "rgba(29,54,64,0.18)";
    g.beginPath();
    g.arc(rand() * W, rand() * H, 0.3 + rand() * 0.8, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** Light and shadow laid over the bands: lit from the upper left, with a glowing rim. */
function shadeSprite(r: number) {
  const S = r * 2 + 8;
  const { c, g } = canvas(S, S);
  const cx = S / 2;
  g.save();
  g.beginPath();
  g.arc(cx, cx, r, 0, Math.PI * 2);
  g.clip();
  const light = g.createRadialGradient(cx - r * 0.45, cx - r * 0.45, r * 0.05, cx - r * 0.2, cx - r * 0.2, r * 1.3);
  light.addColorStop(0, "rgba(255,250,235,0.45)");
  light.addColorStop(0.35, "rgba(255,250,235,0.05)");
  light.addColorStop(0.7, "rgba(14,26,32,0.25)");
  light.addColorStop(1, "rgba(14,26,32,0.85)");
  g.fillStyle = light;
  g.fillRect(0, 0, S, S);
  g.restore();
  // thin lit rim on the sunny side
  g.strokeStyle = "rgba(255,240,215,0.55)";
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(cx, cx, r - 0.8, Math.PI * 0.95, Math.PI * 1.65);
  g.stroke();
  return c;
}

/** A ring, split into the half behind the planet and the half in front. */
function ringSprites(r: number) {
  const W = r * 4.2;
  const H = r * 1.4;
  const make = (half: "back" | "front") => {
    const { c, g } = canvas(W, H);
    g.translate(W / 2, H / 2);
    const bands: [number, string, number][] = [
      [1.95, "rgba(244,234,215,0.35)", 0.06],
      [1.82, "rgba(108,196,192,0.85)", 0.07],
      [1.68, "rgba(244,234,215,0.9)", 0.1],
      [1.52, "rgba(226,103,47,0.7)", 0.05],
      [1.42, "rgba(244,234,215,0.45)", 0.06],
    ];
    for (const [k, col, wdt] of bands) {
      g.strokeStyle = col;
      g.lineWidth = r * wdt;
      g.beginPath();
      if (half === "back") g.ellipse(0, 0, r * k, r * k * 0.24, 0, Math.PI, Math.PI * 2);
      else g.ellipse(0, 0, r * k, r * k * 0.24, 0, 0, Math.PI);
      g.stroke();
    }
    return c;
  };
  return { back: make("back"), front: make("front") };
}

export function createSpace() {
  let stars: { x: number; y: number; r: number; p: number; warm: boolean }[] = [];
  let planets: Planet[] = [];
  let haze: { x: number; y: number; r: number; col: string }[] = [];

  /** Lay out space between world y0 and y1. */
  function resize(w: number, h: number, y0: number, y1: number, issues: { label: string; href: string }[]) {
    const rand = seeded(13);
    stars = Array.from({ length: Math.floor((w * (y1 - y0)) / 2400) }, () => ({
      x: rand() * w,
      y: y0 - h * 1.2 + rand() * (y1 - y0 + h * 1.2),
      r: rand() < 0.07 ? 1.8 : 0.4 + rand() * 0.9,
      p: rand() * 6.28,
      warm: rand() < 0.2,
    }));
    haze = [
      { x: w * 0.15, y: y0 + (y1 - y0) * 0.3, r: Math.max(w, h) * 0.5, col: "108,196,192" },
      { x: w * 0.85, y: y0 + (y1 - y0) * 0.75, r: Math.max(w, h) * 0.45, col: "226,103,47" },
      { x: w * 0.6, y: y0 - h * 0.6, r: Math.max(w, h) * 0.5, col: "108,196,192" },
    ];
    const m = Math.min(w, h);
    const narrow = w < 700;
    const spots = narrow
      ? [
          { x: 0.34, y: 0.2, r: 0.2 },
          { x: 0.7, y: 0.52, r: 0.15 },
          { x: 0.3, y: 0.82, r: 0.12 },
        ]
      : [
          { x: 0.24, y: 0.3, r: 0.16 },
          { x: 0.72, y: 0.5, r: 0.12 },
          { x: 0.42, y: 0.8, r: 0.09 },
        ];
    const palettes = [
      [ORANGE, CREAM, "#c9552a", TEAL, CREAM, ORANGE, INK, CREAM, ORANGE],
      [TEAL, CREAM, "#4fa9a5", ORANGE, CREAM, TEAL, CREAM],
      [CREAM, ORANGE, CREAM, TEAL, "#f0a26c", CREAM, ORANGE],
    ];
    planets = issues.slice(0, 3).map((iss, i) => {
      const r = spots[i].r * m;
      const rings = i === 1 ? ringSprites(r) : null;
      return {
        x: spots[i].x * w,
        y: y0 + (y1 - y0) * 0.1 + spots[i].y * (y1 - y0) * 0.55,
        r,
        ring: i === 1,
        label: iss.label,
        href: iss.href,
        hover: 0,
        bands: bandStrip(r, palettes[i], 100 + i, i === 0),
        shade: shadeSprite(r),
        ringBack: rings?.back,
        ringFront: rings?.front,
        speed: 6 + i * 3,
      };
    });
  }

  function drawBackdrop(ctx: CanvasRenderingContext2D, t: number, top: number, bottom: number) {
    for (const hz of haze) {
      if (hz.y + hz.r < top || hz.y - hz.r > bottom) continue;
      const g = ctx.createRadialGradient(hz.x, hz.y, 0, hz.x, hz.y, hz.r);
      g.addColorStop(0, `rgba(${hz.col},0.12)`);
      g.addColorStop(1, `rgba(${hz.col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(hz.x - hz.r, hz.y - hz.r, hz.r * 2, hz.r * 2);
    }
    for (const s of stars) {
      if (s.y < top || s.y > bottom) continue;
      ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 1.3 + s.p);
      ctx.fillStyle = s.warm ? "#ffd9b0" : CREAM;
      ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function draw(
    ctx: CanvasRenderingContext2D,
    t: number,
    dt: number,
    pointer: { x: number; y: number; inside: boolean },
    top = -Infinity,
    bottom = Infinity,
  ) {
    drawBackdrop(ctx, t, top, bottom);
    for (const p of planets) {
      if (p.y + p.r * 2 < top || p.y - p.r * 2 > bottom) continue;
      const over = pointer.inside && Math.hypot(pointer.x - p.x, pointer.y - p.y) < p.r * 1.1;
      p.hover += ((over ? 1 : 0) - p.hover) * Math.min(1, dt * 8);
      const r = p.r * (1 + p.hover * 0.04);
      const tilt = -0.22;
      if (p.ringBack) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(tilt);
        const w = p.ringBack.width / SCALE;
        const h = p.ringBack.height / SCALE;
        ctx.drawImage(p.ringBack, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      // the bands drift past, as if the planet turns
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.clip();
      const bw = p.bands.width / SCALE;
      const bh = p.bands.height / SCALE;
      const k = r / p.r;
      const off = ((t * p.speed) % bw) * k;
      // two copies side by side, so the strip wraps without a seam
      ctx.drawImage(p.bands, p.x - r - off, p.y - r, bw * k, bh * k);
      ctx.drawImage(p.bands, p.x - r - off + bw * k, p.y - r, bw * k, bh * k);
      ctx.restore();
      const sw = p.shade.width / SCALE;
      ctx.drawImage(p.shade, p.x - (sw / 2) * (r / p.r), p.y - (sw / 2) * (r / p.r), sw * (r / p.r), sw * (r / p.r));
      if (p.ringFront) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(tilt);
        const w = p.ringFront.width / SCALE;
        const h = p.ringFront.height / SCALE;
        ctx.drawImage(p.ringFront, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      // label
      ctx.fillStyle = CREAM;
      ctx.globalAlpha = 0.7 + p.hover * 0.3;
      ctx.font = `700 12px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(p.label, p.x, p.y + r + (p.ring ? 34 : 22));
      ctx.globalAlpha = 1;
      if (p.hover > 0.02) {
        ctx.strokeStyle = `rgba(244,234,215,${p.hover * 0.8})`;
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 12, t * 0.5, t * 0.5 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  /** the planet under a point, if any */
  const hit = (x: number, y: number) => planets.find((p) => Math.hypot(x - p.x, y - p.y) < p.r * 1.1);

  return { resize, draw, drawBackdrop, hit };
}

/** A bright four-point star with a soft glow: the one we zoom into. */
export function drawBeacon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number) {
  const pulse = 1 + 0.08 * Math.sin(t * 2.2);
  const s = size * pulse;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 3);
  glow.addColorStop(0, "rgba(255,244,220,0.9)");
  glow.addColorStop(0.15, "rgba(255,220,170,0.45)");
  glow.addColorStop(0.5, "rgba(108,196,192,0.12)");
  glow.addColorStop(1, "rgba(108,196,192,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.6);
  ctx.bezierCurveTo(x + s * 0.12, y - s * 0.12, x + s * 0.12, y - s * 0.12, x + s * 1.6, y);
  ctx.bezierCurveTo(x + s * 0.12, y + s * 0.12, x + s * 0.12, y + s * 0.12, x, y + s * 1.6);
  ctx.bezierCurveTo(x - s * 0.12, y + s * 0.12, x - s * 0.12, y + s * 0.12, x - s * 1.6, y);
  ctx.bezierCurveTo(x - s * 0.12, y - s * 0.12, x - s * 0.12, y - s * 0.12, x, y - s * 1.6);
  ctx.fill();
}
