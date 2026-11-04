// Space, after the poster: dark teal, stippled stars, and striped planets.
// Each planet is an issue of the magazine.
import { seeded } from "../canvasLoop";
import { CREAM, INK, ORANGE, TEAL } from "./launch";

export type Planet = { x: number; y: number; r: number; ring: boolean; bands: string[]; label: string; href: string; hover: number };

export function createSpace() {
  let stars: { x: number; y: number; r: number; p: number }[] = [];
  let planets: Planet[] = [];

  /** Lay out space between world y0 and y1. */
  function resize(w: number, h: number, y0: number, y1: number, issues: { label: string; href: string }[]) {
    const rand = seeded(13);
    stars = Array.from({ length: Math.floor((w * (y1 - y0)) / 2600) }, () => ({
      x: rand() * w,
      y: y0 + rand() * (y1 - y0),
      r: rand() < 0.08 ? 1.6 : 0.5 + rand() * 0.8,
      p: rand() * 6.28,
    }));
    const m = Math.min(w, h);
    const narrow = w < 700;
    // the newest issue is the closest planet
    const spots = narrow
      ? [
          { x: 0.32, y: 0.2, r: 0.2 },
          { x: 0.72, y: 0.52, r: 0.15 },
          { x: 0.3, y: 0.8, r: 0.12 },
        ]
      : [
          { x: 0.24, y: 0.3, r: 0.16 },
          { x: 0.72, y: 0.5, r: 0.12 },
          { x: 0.42, y: 0.8, r: 0.09 },
        ];
    const palettes = [
      [ORANGE, CREAM, TEAL, ORANGE, INK, CREAM, ORANGE],
      [TEAL, CREAM, TEAL, ORANGE, CREAM, TEAL],
      [CREAM, ORANGE, CREAM, TEAL, ORANGE, CREAM],
    ];
    planets = issues.slice(0, 3).map((iss, i) => ({
      x: spots[i].x * w,
      y: y0 + (y1 - y0) * 0.1 + spots[i].y * (y1 - y0) * 0.55,
      r: spots[i].r * m,
      ring: i === 1,
      bands: palettes[i],
      label: iss.label,
      href: iss.href,
      hover: 0,
    }));
  }

  function draw(
    ctx: CanvasRenderingContext2D,
    t: number,
    dt: number,
    pointer: { x: number; y: number; inside: boolean },
    top = -Infinity,
    bottom = Infinity,
  ) {
    ctx.fillStyle = CREAM;
    for (const s of stars) {
      if (s.y < top || s.y > bottom) continue;
      ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 1.3 + s.p);
      ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    ctx.globalAlpha = 1;
    for (const p of planets) {
      const over = pointer.inside && Math.hypot(pointer.x - p.x, pointer.y - p.y) < p.r * 1.1;
      p.hover += ((over ? 1 : 0) - p.hover) * Math.min(1, dt * 8);
      const r = p.r * (1 + p.hover * 0.05);
      if (p.ring) ring(ctx, p, r, "back");
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.clip();
      // wavy bands that slowly drift, like the poster's gas giants
      const bh = (r * 2) / p.bands.length;
      for (let i = -1; i <= p.bands.length; i++) {
        ctx.fillStyle = p.bands[(i + p.bands.length) % p.bands.length];
        ctx.beginPath();
        const y = p.y - r + i * bh;
        // run the wave a little past both edges so no corner shows inside the planet
        ctx.moveTo(p.x - r * 1.2, y);
        for (let x = -r * 1.2; x <= r * 1.2; x += r / 10) ctx.lineTo(p.x + x, y + Math.sin((x / r) * 6 + t * 0.6 + i) * bh * 0.18);
        ctx.lineTo(p.x + r * 1.2, y + bh * 1.4);
        ctx.lineTo(p.x - r * 1.2, y + bh * 1.4);
        ctx.fill();
      }
      // shade the far side
      const sh = ctx.createRadialGradient(p.x - r * 0.4, p.y - r * 0.4, r * 0.2, p.x, p.y, r * 1.05);
      sh.addColorStop(0, "rgba(29,54,64,0)");
      sh.addColorStop(1, "rgba(29,54,64,0.55)");
      ctx.fillStyle = sh;
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      ctx.restore();
      if (p.ring) ring(ctx, p, r, "front");
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

  return { resize, draw, hit };
}

function ring(ctx: CanvasRenderingContext2D, p: Planet, r: number, half: "back" | "front") {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-0.25);
  ctx.beginPath();
  if (half === "back") ctx.ellipse(0, 0, r * 1.75, r * 0.42, 0, Math.PI, Math.PI * 2);
  else ctx.ellipse(0, 0, r * 1.75, r * 0.42, 0, 0, Math.PI);
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = r * 0.12;
  ctx.stroke();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();
  ctx.restore();
}
