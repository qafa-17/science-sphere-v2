// The launch: a rocket on a sea platform, after the space-exploration poster
// reference but painted with the same care as the fish: rounded shading,
// panel lines, rivets and a speckled finish.
import { seeded } from "../canvasLoop";

export const INK = "#1d3640";
export const CREAM = "#f4ead7";
export const ORANGE = "#e2672f";
export const TEAL = "#6cc4c0";

const SCALE = 2; // sprites are drawn at twice their size, for sharp edges

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * SCALE);
  c.height = Math.ceil(h * SCALE);
  const g = c.getContext("2d")!;
  g.scale(SCALE, SCALE);
  return { c, g };
}

/** Speckles inside whatever is clipped, like the fish. */
function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number, light = 0.4, dark = 0.12) {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.7 ? `rgba(255,255,255,${light})` : `rgba(29,54,64,${dark})`;
    g.beginPath();
    g.arc(r() * w, r() * h, 0.3 + r() * 0.9, 0, Math.PI * 2);
    g.fill();
  }
}

/** A horizontal "round object" shading: shadow on the left, light just right of centre. */
function roundShade(g: CanvasRenderingContext2D, x0: number, x1: number, dark: string, mid: string, light: string, edge: string) {
  const s = g.createLinearGradient(x0, 0, x1, 0);
  s.addColorStop(0, dark);
  s.addColorStop(0.35, mid);
  s.addColorStop(0.62, light);
  s.addColorStop(1, edge);
  return s;
}

// ---------- the rocket ----------
const ROCKET_H = 360;
const RW = ROCKET_H * 0.24;
const PAD = 60; // room around the rocket in the sprite for fins
let rocketSprite: HTMLCanvasElement | null = null;

function makeRocket() {
  const H = ROCKET_H;
  const W = RW;
  const SW = W * 2 + PAD * 2;
  const SH = H + 20;
  const { c, g } = canvas(SW, SH);
  g.translate(SW / 2, H + 4); // base of the rocket
  g.lineJoin = "round";

  // fins, behind the body
  for (const side of [-1, 1]) {
    const fin = new Path2D();
    fin.moveTo(side * W * 0.45, -H * 0.32);
    fin.bezierCurveTo(side * W * 0.8, -H * 0.24, side * W * 1.05, -H * 0.12, side * W * 1.1, -H * 0.02);
    fin.lineTo(side * W * 0.96, H * 0.0);
    fin.lineTo(side * W * 0.45, -H * 0.06);
    fin.closePath();
    g.fillStyle = side < 0 ? roundShade(g, -W * 1.1, -W * 0.45, "#a8431c", "#c9552a", "#e9773f", "#d0602f") : roundShade(g, W * 0.45, W * 1.1, "#d2602d", "#f08a4b", "#e57638", "#b24a20");
    g.fill(fin);
    g.save();
    g.clip(fin);
    g.translate(side < 0 ? -W * 1.2 : W * 0.4, -H * 0.34);
    speckle(g, W * 0.8, H * 0.36, 60, 3 + side, 0.35, 0.15);
    g.restore();
    // a teal edge along the fin's leading side
    g.strokeStyle = "rgba(108,196,192,0.9)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(side * W * 0.5, -H * 0.3);
    g.bezierCurveTo(side * W * 0.8, -H * 0.22, side * W * 1.0, -H * 0.12, side * W * 1.06, -H * 0.04);
    g.stroke();
    g.strokeStyle = "rgba(29,54,64,0.55)";
    g.lineWidth = 1.5;
    g.stroke(fin);
  }

  // nozzle bell
  const bell = g.createLinearGradient(-W * 0.32, 0, W * 0.32, 0);
  bell.addColorStop(0, "#0f2229");
  bell.addColorStop(0.55, "#3c5a63");
  bell.addColorStop(1, "#14282f");
  g.fillStyle = bell;
  g.beginPath();
  g.moveTo(-W * 0.22, -H * 0.06);
  g.lineTo(W * 0.22, -H * 0.06);
  g.quadraticCurveTo(W * 0.28, -H * 0.02, W * 0.33, 0);
  g.lineTo(-W * 0.33, 0);
  g.quadraticCurveTo(-W * 0.28, -H * 0.02, -W * 0.22, -H * 0.06);
  g.fill();
  g.fillStyle = "rgba(244,234,215,0.35)";
  g.fillRect(-W * 0.33, -2, W * 0.66, 2);

  // body
  const body = new Path2D();
  body.moveTo(-W / 2, -H * 0.06);
  body.lineTo(-W / 2, -H * 0.62);
  body.bezierCurveTo(-W / 2, -H * 0.82, -W * 0.2, -H * 0.95, 0, -H);
  body.bezierCurveTo(W * 0.2, -H * 0.95, W / 2, -H * 0.82, W / 2, -H * 0.62);
  body.lineTo(W / 2, -H * 0.06);
  body.closePath();
  g.fillStyle = roundShade(g, -W / 2, W / 2, "#7cc7c3", "#e9e0cc", "#fbf5e8", "#cdbf9f");
  g.fill(body);

  g.save();
  g.clip(body);
  // the orange nose and bands, shaded the same way
  const orange = roundShade(g, -W / 2, W / 2, "#b4461d", "#e2672f", "#f59157", "#c25226");
  g.fillStyle = orange;
  g.beginPath();
  g.moveTo(-W, -H * 0.86);
  g.bezierCurveTo(-W * 0.3, -H * 0.875, W * 0.3, -H * 0.875, W, -H * 0.86);
  g.lineTo(W, -H * 1.1);
  g.lineTo(-W, -H * 1.1);
  g.fill();
  for (const [y, hh] of [
    [-H * 0.8, H * 0.035],
    [-H * 0.21, H * 0.045],
  ]) {
    g.beginPath();
    g.moveTo(-W, y);
    g.bezierCurveTo(-W * 0.3, y + 4, W * 0.3, y + 4, W, y);
    g.lineTo(W, y + hh);
    g.bezierCurveTo(W * 0.3, y + hh + 4, -W * 0.3, y + hh + 4, -W, y + hh);
    g.fill();
  }
  // panel lines, curved a little to read as a cylinder
  g.strokeStyle = "rgba(29,54,64,0.28)";
  g.lineWidth = 1;
  for (const y of [-H * 0.68, -H * 0.55, -H * 0.42, -H * 0.3, -H * 0.13]) {
    g.beginPath();
    g.moveTo(-W / 2, y);
    g.bezierCurveTo(-W * 0.2, y + 3, W * 0.2, y + 3, W / 2, y);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(W * 0.3, -H * 0.8);
  g.lineTo(W * 0.3, -H * 0.06);
  g.stroke();
  // rivets along the bands
  g.fillStyle = "rgba(29,54,64,0.35)";
  for (const y of [-H * 0.215, -H * 0.165, -H * 0.805]) {
    for (let k = -3; k <= 3; k++) {
      const x = (k / 3.4) * (W / 2);
      g.beginPath();
      g.arc(x, y + 2.5 * (1 - (x / (W / 2)) ** 2), 1.1, 0, Math.PI * 2);
      g.fill();
    }
  }
  // speckled finish and a long highlight
  g.translate(-W / 2, -H);
  speckle(g, W, H, 420, 21, 0.45, 0.1);
  g.translate(W / 2, H);
  const hl = g.createLinearGradient(W * 0.05, 0, W * 0.2, 0);
  hl.addColorStop(0, "rgba(255,255,255,0)");
  hl.addColorStop(0.5, "rgba(255,255,255,0.55)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = hl;
  g.fillRect(W * 0.05, -H * 0.93, W * 0.15, H * 0.86);
  g.restore();
  g.strokeStyle = "rgba(29,54,64,0.6)";
  g.lineWidth = 1.6;
  g.stroke(body);

  // the letters running down it
  g.font = `800 ${H * 0.085}px "Archivo Variable", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  ["S", "S"].forEach((ch, i) => {
    const y = -H * (0.7 - i * 0.105);
    g.fillStyle = "rgba(120,40,15,0.35)";
    g.fillText(ch, W * 0.08 + 1.5, y + 1.5);
    g.fillStyle = ORANGE;
    g.fillText(ch, W * 0.08, y);
  });

  // porthole: a metal ring, tinted glass and a crescent of light
  const px = W * 0.06;
  const py = -H * 0.43;
  const pr = W * 0.17;
  const ring = g.createLinearGradient(px - pr, py - pr, px + pr, py + pr);
  ring.addColorStop(0, "#f7f0e0");
  ring.addColorStop(0.5, "#9fb3b2");
  ring.addColorStop(1, "#4d6870");
  g.fillStyle = ring;
  g.beginPath();
  g.arc(px, py, pr, 0, Math.PI * 2);
  g.fill();
  const glass = g.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr * 0.8);
  glass.addColorStop(0, "#c8f0ec");
  glass.addColorStop(0.5, TEAL);
  glass.addColorStop(1, "#2c6f73");
  g.fillStyle = glass;
  g.beginPath();
  g.arc(px, py, pr * 0.74, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(px, py, pr * 0.5, Math.PI * 1.1, Math.PI * 1.55);
  g.stroke();
  return c;
}

/** The rocket, standing on its base point (x, y), H tall. thrust 0..1 lights the engine. */
let fontsHooked = false;
export function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, H: number, t: number, thrust: number) {
  if (!fontsHooked) {
    fontsHooked = true;
    // repaint once the heading font has loaded, so the letters use it
    document.fonts?.ready.then(() => {
      rocketSprite = null;
    });
  }
  if (!rocketSprite) rocketSprite = makeRocket();
  const k = H / ROCKET_H;
  const W = RW * k;
  ctx.save();
  ctx.translate(x, y);

  if (thrust > 0) {
    const flick = 0.88 + 0.12 * Math.sin(t * 41) + 0.06 * Math.sin(t * 23);
    const L = H * (0.25 + 0.5 * thrust) * flick;
    // glow
    const glow = ctx.createRadialGradient(0, L * 0.25, 0, 0, L * 0.25, L * 0.9);
    glow.addColorStop(0, `rgba(255,190,120,${0.45 * thrust})`);
    glow.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-L, -L * 0.6, L * 2, L * 2);
    // outer flame
    const outer = ctx.createLinearGradient(0, 0, 0, L);
    outer.addColorStop(0, "#ffb36b");
    outer.addColorStop(0.5, ORANGE);
    outer.addColorStop(1, "rgba(226,103,47,0)");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.moveTo(-W * 0.3, 0);
    ctx.bezierCurveTo(-W * 0.42, L * 0.35, -W * 0.12, L * 0.75, 0, L);
    ctx.bezierCurveTo(W * 0.12, L * 0.75, W * 0.42, L * 0.35, W * 0.3, 0);
    ctx.fill();
    // white-hot core
    const core = ctx.createLinearGradient(0, 0, 0, L * 0.6);
    core.addColorStop(0, "#fffaf0");
    core.addColorStop(1, "rgba(255,240,210,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(-W * 0.17, 0);
    ctx.quadraticCurveTo(-W * 0.16, L * 0.35, 0, L * 0.6);
    ctx.quadraticCurveTo(W * 0.16, L * 0.35, W * 0.17, 0);
    ctx.fill();
  }

  const sw = rocketSprite.width / SCALE;
  const sh = rocketSprite.height / SCALE;
  ctx.drawImage(rocketSprite, (-sw / 2) * k, -(ROCKET_H + 4) * k, sw * k, sh * k);
  ctx.restore();
}

/** The launch tower and deck, floating on the water at y. */
export function drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.save();
  // deck, with a lit top edge
  const deck = ctx.createLinearGradient(0, y - H * 0.05, 0, y + H * 0.01);
  deck.addColorStop(0, "#3d5c66");
  deck.addColorStop(0.25, INK);
  deck.addColorStop(1, "#10222a");
  ctx.fillStyle = deck;
  ctx.fillRect(x - H * 0.55, y - H * 0.05, H * 1.1, H * 0.06);
  ctx.fillStyle = INK;
  ctx.fillRect(x - H * 0.5, y + H * 0.01, H * 0.08, H * 0.05);
  ctx.fillRect(x + H * 0.42, y + H * 0.01, H * 0.08, H * 0.05);
  // hazard stripes along the deck
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - H * 0.55, y - H * 0.012, H * 1.1, H * 0.012);
  ctx.clip();
  ctx.fillStyle = "rgba(244,234,215,0.55)";
  for (let s = -H * 0.6; s < H * 0.6; s += H * 0.04) {
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s + H * 0.02, y);
    ctx.lineTo(x + s + H * 0.032, y - H * 0.012);
    ctx.lineTo(x + s + H * 0.012, y - H * 0.012);
    ctx.fill();
  }
  ctx.restore();
  // tower
  const tx = x + H * 0.3;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, H * 0.012);
  ctx.beginPath();
  ctx.moveTo(tx, y - H * 0.05);
  ctx.lineTo(tx, y - H * 1.12);
  ctx.moveTo(tx + H * 0.1, y - H * 0.05);
  ctx.lineTo(tx + H * 0.1, y - H * 1.12);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.8, H * 0.006);
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const yy = y - H * 0.05 - k * H * 0.105;
    ctx.moveTo(tx, yy);
    ctx.lineTo(tx + H * 0.1, yy - H * 0.105);
    ctx.moveTo(tx + H * 0.1, yy);
    ctx.lineTo(tx, yy - H * 0.105);
  }
  ctx.moveTo(tx, y - H * 0.8);
  ctx.lineTo(x + H * 0.13, y - H * 0.8);
  ctx.moveTo(tx, y - H * 0.55);
  ctx.lineTo(x + H * 0.13, y - H * 0.55);
  ctx.stroke();
  // a beacon on top
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.arc(tx + H * 0.05, y - H * 1.14, H * 0.018, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- smoke ----------
function puffSprite(inner: string, outer: string, dots: string, seed: number) {
  const S = 120;
  const { c, g } = canvas(S, S);
  const r = g.createRadialGradient(S * 0.42, S * 0.38, S * 0.05, S / 2, S / 2, S / 2);
  r.addColorStop(0, inner);
  r.addColorStop(0.7, outer);
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.beginPath();
  g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.48, 0, Math.PI * 2);
  g.clip();
  const rand = seeded(seed);
  g.fillStyle = dots;
  for (let i = 0; i < 160; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * S * 0.48;
    g.globalAlpha = 0.25 + 0.5 * (d / (S * 0.48));
    g.beginPath();
    g.arc(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 0.5 + rand() * 1.1, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  return c;
}

type Puff = { x: number; y: number; r: number; vx: number; vy: number; age: number; life: number; kind: number; spin: number };

/** Billowing smoke, soft and speckled. */
export function createSmoke() {
  const puffs: Puff[] = [];
  const rand = seeded(3);
  let sprites: HTMLCanvasElement[] | null = null;
  return {
    emit(x: number, y: number, power: number, dt: number) {
      const n = Math.floor(power * 50 * dt + rand());
      for (let i = 0; i < n; i++) {
        const dir = rand() < 0.5 ? -1 : 1;
        puffs.push({
          x: x + (rand() - 0.5) * 24,
          y: y - rand() * 10,
          r: 14 + rand() * 18,
          vx: dir * (50 + rand() * 170),
          vy: -8 - rand() * 36,
          age: 0,
          life: 2.6 + rand() * 2.2,
          kind: rand() < 0.3 ? 1 : rand() < 0.5 ? 2 : 0,
          spin: rand() * 6.28,
        });
      }
    },
    draw(ctx: CanvasRenderingContext2D, dt: number) {
      if (!sprites)
        sprites = [
          puffSprite("rgba(255,250,240,1)", "rgba(240,224,200,0.9)", "#e2672f", 1),
          puffSprite("rgba(250,170,110,1)", "rgba(226,103,47,0.85)", "#fff4e0", 2),
          puffSprite("rgba(250,235,215,1)", "rgba(230,190,160,0.85)", "#c4552a", 3),
        ];
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
        p.r += dt * 24;
        ctx.globalAlpha = Math.min(1, (1 - p.age / p.life) * 1.4);
        const s = p.r * 2;
        ctx.drawImage(sprites[p.kind], p.x - p.r, p.y - p.r, s, s);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ---------- clouds ----------
const cloudSprites: HTMLCanvasElement[] = [];
function cloudSprite(seed: number) {
  const W = 260;
  const H = 130;
  const { c, g } = canvas(W, H);
  const rand = seeded(seed);
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    x: W * (0.18 + (i / 6) * 0.64) + (rand() - 0.5) * 20,
    y: H * (0.62 - Math.sin((i / 6) * Math.PI) * 0.22) + (rand() - 0.5) * 10,
    r: H * (0.2 + Math.sin((i / 6) * Math.PI) * 0.16 + rand() * 0.06),
  }));
  const shape = new Path2D();
  for (const b of blobs) shape.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  shape.rect(W * 0.14, H * 0.62, W * 0.72, H * 0.2);
  const fill = g.createLinearGradient(0, H * 0.15, 0, H * 0.85);
  fill.addColorStop(0, "#fffaf0");
  fill.addColorStop(0.6, "#f6e6cf");
  fill.addColorStop(1, "#eebf98");
  g.fillStyle = fill;
  g.fill(shape, "nonzero");
  g.save();
  g.clip(shape);
  speckle(g, W, H, 260, seed + 5, 0.55, 0.08);
  // soft shadow on the underside
  const under = g.createLinearGradient(0, H * 0.55, 0, H * 0.85);
  under.addColorStop(0, "rgba(226,103,47,0)");
  under.addColorStop(1, "rgba(226,103,47,0.25)");
  g.fillStyle = under;
  g.fillRect(0, 0, W, H);
  g.restore();
  return c;
}

/** A soft, speckled cloud centred at (x, y), about s*2.6 wide. */
export function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, variant = 0) {
  if (!cloudSprites.length) for (let i = 0; i < 3; i++) cloudSprites.push(cloudSprite(70 + i));
  const sp = cloudSprites[variant % cloudSprites.length];
  const w = s * 3.4;
  const h = w / 2;
  ctx.globalAlpha = 0.95;
  ctx.drawImage(sp, x - w / 2, y - h * 0.6, w, h);
  ctx.globalAlpha = 1;
}

/** A tile of fine grain, as an image, to lay over the whole scene. */
export function grainDataUrl() {
  const S = 220;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const rand = seeded(77);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = rand() < 0.5 ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
    g.fillRect(rand() * S, rand() * S, 1, 1);
  }
  return c.toDataURL();
}
