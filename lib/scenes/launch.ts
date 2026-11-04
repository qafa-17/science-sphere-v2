// The launch: a retro screen-print rocket on a sea platform, after the space
// exploration poster reference. Cream, orange and teal, with dotted smoke.
import { seeded } from "../canvasLoop";

export const INK = "#1d3640";
export const CREAM = "#f4ead7";
export const ORANGE = "#e2672f";
export const TEAL = "#6cc4c0";

/** The rocket, standing on its base point (x, y), H tall. */
export function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, H: number, t: number, thrust: number) {
  const W = H * 0.24;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.5, H * 0.008);
  ctx.strokeStyle = INK;

  // flame
  if (thrust > 0) {
    const flick = 0.85 + 0.15 * Math.sin(t * 40) + 0.08 * Math.sin(t * 23);
    const L = H * (0.25 + 0.45 * thrust) * flick;
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.moveTo(-W * 0.32, 0);
    ctx.quadraticCurveTo(-W * 0.4, L * 0.5, 0, L);
    ctx.quadraticCurveTo(W * 0.4, L * 0.5, W * 0.32, 0);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.moveTo(-W * 0.18, 0);
    ctx.quadraticCurveTo(-W * 0.2, L * 0.35, 0, L * 0.62);
    ctx.quadraticCurveTo(W * 0.2, L * 0.35, W * 0.18, 0);
    ctx.fill();
  }

  // nozzle
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-W * 0.3, 0);
  ctx.lineTo(W * 0.3, 0);
  ctx.lineTo(W * 0.22, -H * 0.06);
  ctx.lineTo(-W * 0.22, -H * 0.06);
  ctx.closePath();
  ctx.fill();

  // fins
  ctx.fillStyle = ORANGE;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * W * 0.45, -H * 0.3);
    ctx.lineTo(side * W * 1.05, -H * 0.05);
    ctx.lineTo(side * W * 0.95, H * 0.02);
    ctx.lineTo(side * W * 0.45, -H * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // body: a long capsule with a pointed nose
  const body = new Path2D();
  body.moveTo(-W / 2, -H * 0.06);
  body.lineTo(-W / 2, -H * 0.62);
  body.bezierCurveTo(-W / 2, -H * 0.82, -W * 0.2, -H * 0.94, 0, -H);
  body.bezierCurveTo(W * 0.2, -H * 0.94, W / 2, -H * 0.82, W / 2, -H * 0.62);
  body.lineTo(W / 2, -H * 0.06);
  body.closePath();
  ctx.fillStyle = CREAM;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  // teal shadow down one side
  ctx.fillStyle = TEAL;
  ctx.fillRect(-W / 2, -H, W * 0.24, H);
  // orange bands
  ctx.fillStyle = ORANGE;
  ctx.fillRect(-W, -H * 0.86, W * 2, H * 0.05);
  ctx.fillRect(-W, -H * 0.2, W * 2, H * 0.04);
  ctx.beginPath();
  ctx.moveTo(-W, -H * 0.94);
  ctx.lineTo(W, -H * 0.94);
  ctx.lineTo(W, -H);
  ctx.lineTo(-W, -H);
  ctx.fill();
  ctx.restore();
  ctx.stroke(body);

  // the letters running down it, like the poster's "USA"
  ctx.fillStyle = ORANGE;
  ctx.font = `800 ${H * 0.085}px "Archivo Variable", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ["S", "S"].forEach((ch, i) => ctx.fillText(ch, W * 0.06, -H * (0.7 - i * 0.11)));
  // window
  ctx.fillStyle = TEAL;
  ctx.beginPath();
  ctx.arc(W * 0.06, -H * 0.42, W * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** The launch tower and deck, floating on the water at y. */
export function drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  // deck
  ctx.fillRect(x - H * 0.55, y - H * 0.05, H * 1.1, H * 0.06);
  ctx.fillRect(x - H * 0.5, y + H * 0.01, H * 0.08, H * 0.05);
  ctx.fillRect(x + H * 0.42, y + H * 0.01, H * 0.08, H * 0.05);
  // tower beside the rocket
  const tx = x + H * 0.3;
  ctx.lineWidth = Math.max(1, H * 0.01);
  ctx.beginPath();
  ctx.moveTo(tx, y - H * 0.05);
  ctx.lineTo(tx, y - H * 1.1);
  ctx.moveTo(tx + H * 0.1, y - H * 0.05);
  ctx.lineTo(tx + H * 0.1, y - H * 1.1);
  for (let k = 0; k < 10; k++) {
    const yy = y - H * 0.05 - k * H * 0.105;
    ctx.moveTo(tx, yy);
    ctx.lineTo(tx + H * 0.1, yy - H * 0.105);
  }
  ctx.moveTo(tx, y - H * 0.8);
  ctx.lineTo(x + H * 0.13, y - H * 0.8);
  ctx.stroke();
  ctx.restore();
}

type Puff = { x: number; y: number; r: number; vx: number; vy: number; age: number; life: number; orange: boolean };

/** Billowing smoke, with a spray of printed dots around its edges. */
export function createSmoke() {
  const puffs: Puff[] = [];
  const rand = seeded(3);
  return {
    emit(x: number, y: number, power: number, dt: number) {
      const n = Math.floor(power * 60 * dt + rand());
      for (let i = 0; i < n; i++) {
        const dir = rand() < 0.5 ? -1 : 1;
        puffs.push({
          x: x + (rand() - 0.5) * 20,
          y,
          r: 10 + rand() * 20,
          vx: dir * (40 + rand() * 160),
          vy: -10 - rand() * 40,
          age: 0,
          life: 2.5 + rand() * 2,
          orange: rand() < 0.35,
        });
      }
    },
    draw(ctx: CanvasRenderingContext2D, dt: number) {
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.age += dt;
        if (p.age > p.life) {
          puffs.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - dt * 0.6;
        p.r += dt * 26;
        const a = 1 - p.age / p.life;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.orange ? ORANGE : CREAM;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // printed-dot spray
        ctx.fillStyle = p.orange ? CREAM : ORANGE;
        for (let k = 0; k < 6; k++) {
          const ang = k * 1.05 + p.r * 0.05;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ang) * p.r * 1.15, p.y + Math.sin(ang) * p.r * 1.15, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}

/** Soft cream clouds in the upper sky. */
export function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.9;
  for (const [dx, dy, r] of [
    [0, 0, 1],
    [1.1, 0.15, 0.8],
    [-1.1, 0.2, 0.75],
    [0.5, -0.45, 0.7],
    [-0.5, -0.35, 0.65],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
