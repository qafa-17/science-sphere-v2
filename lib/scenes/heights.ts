// Everything above the water on the way up: painted blue mountains and cloud
// banks, the curve of the planet seen from orbit, a satellite, distant stars,
// and the bright star we fly into. All drawn once into images where possible,
// so each frame only has to place them.
import { seeded } from "../canvasLoop";

const SCALE = 2;

function canvas(w: number, h: number, scale = SCALE) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * scale));
  c.height = Math.max(1, Math.ceil(h * scale));
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  return { c, g };
}

/** Soft dabs of paint, like the brushwork in the cloud references. */
function dab(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${rgb},${a})`);
  grad.addColorStop(0.6, `rgba(${rgb},${a * 0.8})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

// ---------- mountains ----------
/** One ridge of mountains as an image, w wide and h tall, its base at the bottom. */
export function mountainLayer(w: number, h: number, seed: number, top: string, bottom: string, rough: number) {
  const { c, g } = canvas(w, h, 1);
  const rand = seeded(seed);
  // a ridge line built from a few overlapping peaks
  const peaks = Array.from({ length: 5 + Math.floor(rand() * 3) }, () => ({
    x: rand() * w,
    hgt: h * (0.35 + rand() * 0.6),
    wid: w * (0.18 + rand() * 0.3),
  }));
  const ridge = (x: number) => {
    let y = h;
    for (const p of peaks) {
      const d = Math.abs(x - p.x) / p.wid;
      if (d < 1) y = Math.min(y, h - p.hgt * (1 - d * d) * (0.9 + 0.1 * Math.sin(x * 0.05 + p.x)));
    }
    return y + Math.sin(x * 0.11 + seed) * rough + Math.sin(x * 0.37) * rough * 0.4;
  };
  const shape = new Path2D();
  shape.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) shape.lineTo(x, ridge(x));
  shape.lineTo(w, h);
  shape.closePath();
  const fill = g.createLinearGradient(0, 0, 0, h);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  g.fillStyle = fill;
  g.fill(shape);
  // brushy light on the slopes and grain, kept inside the mountains
  g.save();
  g.clip(shape);
  for (let i = 0; i < w / 6; i++) {
    const x = rand() * w;
    const y = ridge(x) + rand() * h * 0.5;
    dab(g, x, y, 10 + rand() * 30, rand() < 0.6 ? "150,170,255" : "20,30,90", 0.08);
  }
  for (let i = 0; i < (w * h) / 220; i++) {
    g.fillStyle = rand() < 0.6 ? "rgba(255,255,255,0.08)" : "rgba(0,0,30,0.12)";
    g.fillRect(rand() * w, rand() * h, 1, 1);
  }
  g.restore();
  return c;
}

// ---------- clouds ----------
const CLOUD_TONES = ["91,111,214", "128,144,224", "60,74,168", "167,180,240", "110,120,190", "200,210,250"];

/** A bank of painterly cloud, about w by h. */
export function cloudBank(w: number, h: number, seed: number) {
  const { c, g } = canvas(w, h, 1);
  const rand = seeded(seed);
  // a lumpy outline, then many soft dabs inside it, darker underneath
  // keep everything well inside the image, so no dab is cut off by its edges
  const lumps = Array.from({ length: 9 }, (_, i) => ({
    x: w * (0.2 + (i / 8) * 0.6) + (rand() - 0.5) * w * 0.05,
    y: h * (0.58 - Math.sin((i / 8) * Math.PI) * (0.14 + rand() * 0.1)),
    r: h * (0.1 + Math.sin((i / 8) * Math.PI) * 0.14 + rand() * 0.05),
  }));
  for (let k = 0; k < 620; k++) {
    const l = lumps[Math.floor(rand() * lumps.length)];
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * l.r;
    const x = l.x + Math.cos(a) * d;
    const y = l.y + Math.sin(a) * d * 0.8;
    const low = y / h; // lower = darker
    const tone = low > 0.62 ? CLOUD_TONES[rand() < 0.5 ? 2 : 4] : low < 0.42 ? CLOUD_TONES[rand() < 0.5 ? 3 : 5] : CLOUD_TONES[Math.floor(rand() * 3)];
    const r = Math.min(6 + rand() * h * 0.09, x, w - x, y, h - y);
    if (r < 3) continue;
    // brush dabs are a little wider than tall, and turned a touch
    g.save();
    g.translate(x, y);
    g.rotate((rand() - 0.5) * 0.6);
    g.scale(1 + rand() * 0.6, 1);
    dab(g, 0, 0, r, tone, 0.3 + rand() * 0.35);
    g.restore();
  }
  return c;
}

// ---------- the planet's edge ----------
/**
 * The curve of the planet below us, seen from orbit: painted streaks of
 * cloud and sea inside a huge circle, with a glowing atmosphere along the rim.
 * Returns an image w wide and depth tall; the curve's top is at y = lift.
 */
export function planetEdge(w: number, depth: number, lift: number, seed: number) {
  const { c, g } = canvas(w, depth, 1);
  const rand = seeded(seed);
  const R = w * 1.6;
  const cx = w * 0.55;
  const cy = lift + R;
  // atmosphere glow
  for (let i = 0; i < 4; i++) {
    g.strokeStyle = `rgba(110,200,255,${0.12 - i * 0.025})`;
    g.lineWidth = 10 + i * 18;
    g.beginPath();
    g.arc(cx, cy, R + 4 + i * 8, Math.PI, Math.PI * 2);
    g.stroke();
  }
  const disc = new Path2D();
  disc.arc(cx, cy, R, 0, Math.PI * 2);
  const base = g.createLinearGradient(0, lift, 0, lift + depth * 0.8);
  base.addColorStop(0, "#bfeaff");
  base.addColorStop(0.08, "#5fb6e8");
  base.addColorStop(0.4, "#2a6fc0");
  base.addColorStop(1, "rgba(27,63,158,0)");
  g.fillStyle = base;
  g.fill(disc);
  g.save();
  g.clip(disc);
  // long horizontal brush streaks that follow the curve
  for (let i = 0; i < 260; i++) {
    const ang = Math.PI * 1.5 + (rand() - 0.5) * 0.7;
    const inset = rand() * depth * 0.35;
    const rr = R - inset;
    const x = cx + Math.cos(ang) * rr;
    const y = cy + Math.sin(ang) * rr;
    const len = 30 + rand() * 140;
    const tone = rand();
    const fade = 1 - inset / (depth * 0.35); // streaks thin out away from the rim
    g.strokeStyle = tone < 0.4 ? `rgba(240,250,255,${0.55 * fade})` : tone < 0.7 ? `rgba(140,210,240,${0.45 * fade})` : `rgba(40,90,170,${0.4 * fade})`;
    g.lineWidth = 1 + rand() * 4;
    g.beginPath();
    g.arc(cx, cy, rr, ang - len / rr / 2, ang + len / rr / 2);
    g.stroke();
    void x;
    void y;
  }
  g.restore();
  // a bright thin rim
  g.strokeStyle = "rgba(220,245,255,0.9)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, R, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();
  return c;
}

// ---------- the satellite ----------
let satSprite: HTMLCanvasElement | null = null;
const SAT_W = 340;
const SAT_H = 300;

function makeSatellite() {
  const { c, g } = canvas(SAT_W, SAT_H);
  const rand = seeded(5);
  g.translate(SAT_W * 0.45, SAT_H * 0.5);
  g.lineCap = "round";

  // long booms and antennas, thin as threads
  g.strokeStyle = "rgba(225,215,190,0.85)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-10, 10);
  g.lineTo(-160, 60);
  g.moveTo(30, -10);
  g.lineTo(150, 120);
  g.moveTo(10, -40);
  g.lineTo(40, -130);
  g.stroke();

  // the main body: a stack of modules, some wrapped in gold foil
  const gold = (x: number, y: number, w: number, h: number) => {
    const gr = g.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, "#f2c46b");
    gr.addColorStop(0.45, "#b9772c");
    gr.addColorStop(0.7, "#e8a24c");
    gr.addColorStop(1, "#7a4a1c");
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
    // crinkles in the foil
    g.strokeStyle = "rgba(255,235,190,0.35)";
    g.lineWidth = 0.6;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      const sx = x + rand() * w;
      g.moveTo(sx, y);
      g.lineTo(sx + (rand() - 0.5) * 10, y + h);
      g.stroke();
    }
  };
  const metal = (x: number, y: number, w: number, h: number) => {
    const gr = g.createLinearGradient(x, y, x + w, y);
    gr.addColorStop(0, "#3c3550");
    gr.addColorStop(0.5, "#8a7f9c");
    gr.addColorStop(1, "#2a2438");
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  };
  g.save();
  g.rotate(0.5);
  metal(-26, -40, 52, 26);
  gold(-30, -14, 60, 46);
  metal(-22, 32, 44, 22);
  gold(-14, 54, 28, 20);
  // nozzles and tanks
  g.fillStyle = "#2a2438";
  g.beginPath();
  g.moveTo(-8, 74);
  g.lineTo(8, 74);
  g.lineTo(12, 88);
  g.lineTo(-12, 88);
  g.fill();
  // a long white instrument boom
  const boom = g.createLinearGradient(30, 0, 40, 0);
  boom.addColorStop(0, "#e9e4d8");
  boom.addColorStop(1, "#9b958a");
  g.fillStyle = boom;
  g.fillRect(28, -6, 10, 70);
  g.fillStyle = "#4a4458";
  g.fillRect(27, 60, 12, 6);
  g.restore();

  // the dish, catching the light
  g.save();
  g.translate(-40, -50);
  g.rotate(-0.55);
  const dish = g.createLinearGradient(-50, -20, 50, 20);
  dish.addColorStop(0, "#f8f3c8");
  dish.addColorStop(0.5, "#cfe39a");
  dish.addColorStop(1, "#7f9b5a");
  g.fillStyle = dish;
  g.beginPath();
  g.ellipse(0, 0, 54, 22, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(60,60,40,0.6)";
  g.lineWidth = 1.5;
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.7)";
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(0, 0, 40, 15, 0, Math.PI * 1.1, Math.PI * 1.7);
  g.stroke();
  // feed struts to the centre
  g.strokeStyle = "rgba(230,225,200,0.8)";
  g.beginPath();
  for (const a of [0.3, 2.4, 4.3]) {
    g.moveTo(Math.cos(a) * 48, Math.sin(a) * 18);
    g.lineTo(0, -26);
  }
  g.stroke();
  g.fillStyle = "#e9e4d8";
  g.beginPath();
  g.arc(0, -26, 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
  return c;
}

/** The satellite, centred at (x, y), scale s (1 = 340px wide), turning by angle a. */
export function drawSatellite(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  if (!satSprite) satSprite = makeSatellite();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.drawImage(satSprite, -SAT_W * 0.45 * s, -SAT_H * 0.5 * s, SAT_W * s, SAT_H * s);
  ctx.restore();
}

// ---------- stars ----------
/**
 * A bright star like the one in the cloud painting: a hot white point, a blue
 * halo, long thin cross-flares and faint ripples around it.
 */
export function drawFlareStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number) {
  const s = size * (1 + 0.06 * Math.sin(t * 2.4));
  const halo = ctx.createRadialGradient(x, y, 0, x, y, s * 6);
  halo.addColorStop(0, "rgba(255,255,255,1)");
  halo.addColorStop(0.08, "rgba(200,220,255,0.9)");
  halo.addColorStop(0.3, "rgba(90,130,255,0.3)");
  halo.addColorStop(1, "rgba(60,90,230,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x - s * 6, y - s * 6, s * 12, s * 12);
  // ripples
  ctx.strokeStyle = "rgba(170,200,255,0.18)";
  ctx.lineWidth = Math.max(0.6, s * 0.06);
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(x, y, s * (1.6 + i * 1.1 + ((t * 0.4) % 1.1)), 0, Math.PI * 2);
    ctx.stroke();
  }
  // long cross flares, fading out
  const flare = (dx: number, dy: number, len: number) => {
    const gr = ctx.createLinearGradient(x, y, x + dx * len, y + dy * len);
    gr.addColorStop(0, "rgba(230,240,255,0.95)");
    gr.addColorStop(1, "rgba(120,150,255,0)");
    ctx.strokeStyle = gr;
    ctx.lineWidth = Math.max(0.8, s * 0.12);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * len, y + dy * len);
    ctx.stroke();
  };
  flare(1, 0, s * 14);
  flare(-1, 0, s * 14);
  flare(0, -1, s * 10);
  flare(0, 1, s * 18);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
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
