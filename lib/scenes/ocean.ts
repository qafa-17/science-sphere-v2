// A school of painted fish, after the deep-blue fish reference: speckled bodies,
// gill lines, ringed eyes, and fainter fish further back. They swim together
// and scatter away from the cursor.
import { seeded } from "../canvasLoop";

const SHADES = [
  { top: "#9cc4ff", bottom: "#4f7fe0" },
  { top: "#7aa6f5", bottom: "#3d63cf" },
  { top: "#5f86e6", bottom: "#2d48b0" },
  { top: "#4a6bd6", bottom: "#24379a" },
];
const GOLD = { top: "#ffd9a0", bottom: "#e8995a" };
const SPRITE_W = 180;
const SPRITE_H = 80;

function fishSprite(shade: { top: string; bottom: string }, seed: number) {
  const scale = 2;
  const c = document.createElement("canvas");
  c.width = SPRITE_W * scale;
  c.height = SPRITE_H * scale;
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  const rand = seeded(seed);
  const grad = g.createLinearGradient(0, 10, 0, 68);
  grad.addColorStop(0, shade.top);
  grad.addColorStop(1, shade.bottom);
  g.fillStyle = grad;

  // tail
  g.beginPath();
  g.moveTo(30, 40);
  g.bezierCurveTo(18, 30, 10, 20, 2, 10);
  g.bezierCurveTo(10, 26, 14, 34, 16, 40);
  g.bezierCurveTo(14, 46, 10, 54, 2, 70);
  g.bezierCurveTo(10, 60, 18, 50, 30, 40);
  g.fill();
  // fins
  g.beginPath();
  g.moveTo(74, 20);
  g.bezierCurveTo(84, 4, 106, 4, 118, 18);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(112, 52);
  g.bezierCurveTo(104, 64, 96, 66, 90, 64);
  g.bezierCurveTo(98, 60, 104, 56, 108, 50);
  g.fill();
  // body
  const body = new Path2D("M24 40 C42 18 100 10 140 22 C160 28 172 36 176 42 C172 48 160 54 140 58 C100 68 42 62 24 40 Z");
  g.fill(body);
  // speckles
  g.save();
  g.clip(body);
  g.fillStyle = "rgba(255,255,255,0.45)";
  for (let i = 0; i < 170; i++) {
    g.beginPath();
    g.arc(26 + rand() * 150, 14 + rand() * 52, 0.4 + rand() * 0.8, 0, Math.PI * 2);
    g.fill();
  }
  // a soft light along the back
  const sheen = g.createLinearGradient(0, 14, 0, 40);
  sheen.addColorStop(0, "rgba(255,255,255,0.25)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, SPRITE_W, 40);
  g.restore();
  // gills
  g.strokeStyle = "rgba(255,255,255,0.6)";
  g.lineWidth = 1;
  for (const gx of [140, 145, 150]) {
    g.beginPath();
    g.moveTo(gx, 30);
    g.quadraticCurveTo(gx - 6, 42, gx, 54);
    g.stroke();
  }
  // eye
  g.fillStyle = "#f4f1e6";
  g.beginPath();
  g.arc(160, 36, 5.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#0b1238";
  g.beginPath();
  g.arc(161, 36, 3.3, 0, Math.PI * 2);
  g.fill();
  return c;
}

type Fish = { x: number; y: number; vx: number; vy: number; sprite: number; size: number; depth: number; wobble: number };

export function createOcean() {
  const sprites = [...SHADES.map((s, i) => fishSprite(s, 40 + i)), fishSprite(GOLD, 99)];
  let fish: Fish[] = [];
  let bubbles: { x: number; y: number; r: number; s: number }[] = [];
  let area = { x0: 0, x1: 0, y0: 0, y1: 0 };

  /** Fill the ocean band (world coordinates) with fish. */
  function resize(w: number, y0: number, y1: number) {
    area = { x0: -80, x1: w + 80, y0: y0 + 60, y1: y1 - 40 };
    const rand = seeded(7);
    const count = w < 700 ? 28 : 46;
    fish = Array.from({ length: count }, (_, i) => {
      const depth = rand() < 0.3 ? 0.35 + rand() * 0.25 : 0.75 + rand() * 0.25;
      return {
        x: rand() * w,
        y: y0 + 80 + rand() * (y1 - y0 - 160),
        vx: -40 - rand() * 20,
        vy: (rand() - 0.5) * 10,
        sprite: i === 3 ? 4 : Math.floor(rand() * 4),
        size: (w < 700 ? 0.55 : 0.8) * (0.7 + rand() * 0.5) * depth,
        depth,
        wobble: rand() * 6.28,
      };
    });
    bubbles = Array.from({ length: 40 }, () => ({
      x: rand() * w,
      y: y0 + rand() * (y1 - y0),
      r: 1 + rand() * 3,
      s: 15 + rand() * 30,
    }));
  }

  function update(dt: number, pointer: { x: number; y: number; inside: boolean }) {
    for (const f of fish) {
      let ax = 0;
      let ay = 0;
      let cx = 0;
      let cy = 0;
      let avx = 0;
      let avy = 0;
      let n = 0;
      for (const o of fish) {
        if (o === f || Math.abs(o.depth - f.depth) > 0.3) continue;
        const dx = o.x - f.x;
        const dy = o.y - f.y;
        const d = Math.hypot(dx, dy);
        if (d < 170) {
          cx += o.x;
          cy += o.y;
          avx += o.vx;
          avy += o.vy;
          n++;
          if (d < 70 * f.size + 20) {
            ax -= (dx / (d || 1)) * 40;
            ay -= (dy / (d || 1)) * 40;
          }
        }
      }
      if (n) {
        ax += (cx / n - f.x) * 0.25 + (avx / n - f.vx) * 0.6;
        ay += (cy / n - f.y) * 0.25 + (avy / n - f.vy) * 0.6;
      }
      // keep drifting left, like the reference, and stay in the water
      ax += (-55 - f.vx) * 0.3;
      if (f.y < area.y0) ay += 60;
      if (f.y > area.y1) ay -= 60;
      // scatter away from the cursor
      if (pointer.inside) {
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < 160) {
          const k = (1 - d / 160) * 900;
          ax += (dx / (d || 1)) * k;
          ay += (dy / (d || 1)) * k;
        }
      }
      f.vx += ax * dt;
      f.vy += ay * dt;
      const sp = Math.hypot(f.vx, f.vy);
      const max = 160;
      if (sp > max) {
        f.vx *= max / sp;
        f.vy *= max / sp;
      }
      f.x += f.vx * dt * (0.6 + f.depth * 0.5);
      f.y += f.vy * dt;
      f.wobble += dt * 6;
      // wrap around the sides
      if (f.x < area.x0) f.x = area.x1;
      if (f.x > area.x1) f.x = area.x0;
    }
    for (const b of bubbles) {
      b.y -= b.s * dt;
      if (b.y < area.y0 - 60) b.y = area.y1;
    }
  }

  function draw(ctx: CanvasRenderingContext2D, top = -Infinity, bottom = Infinity) {
    // far fish first, faded into the blue
    const order = fish.slice().sort((a, b) => a.depth - b.depth);
    for (const f of order) {
      if (f.y < top - 80 || f.y > bottom + 80) continue;
      const img = sprites[f.sprite];
      const ang = Math.atan2(f.vy, f.vx);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(ang);
      if (Math.cos(ang) < 0) ctx.scale(1, -1);
      ctx.rotate(Math.sin(f.wobble) * 0.04);
      ctx.globalAlpha = f.depth < 0.6 ? 0.35 : 0.95;
      const w = SPRITE_W * f.size;
      const h = SPRITE_H * f.size;
      ctx.drawImage(img, -w * 0.62, -h / 2, w, h);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(220,235,255,0.35)";
    ctx.strokeStyle = "rgba(220,235,255,0.5)";
    for (const b of bubbles) {
      if (b.y < top || b.y > bottom) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  return { resize, update, draw };
}
