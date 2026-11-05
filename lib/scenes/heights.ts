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

// ---------- painting helpers ----------
/** A flat, hard-edged brush stroke: a slightly rounded rectangle, turned by `angle`. */
function slab(g: CanvasRenderingContext2D, x: number, y: number, len: number, wid: number, angle: number, colour: string) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = colour;
  g.beginPath();
  g.roundRect(-len / 2, -wid / 2, len, wid, Math.min(wid, len) * 0.35);
  g.fill();
  g.restore();
}

/** A palette-knife stroke: a sharp-cornered, slanted parallelogram. */
function knife(g: CanvasRenderingContext2D, x: number, y: number, len: number, wid: number, angle: number, skew: number, colour: string) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(-len / 2 + skew, -wid / 2);
  g.lineTo(len / 2 + skew, -wid / 2);
  g.lineTo(len / 2 - skew, wid / 2);
  g.lineTo(-len / 2 - skew, wid / 2);
  g.closePath();
  g.fill();
  g.restore();
}

// ---------- mountains ----------
export type MountainColours = {
  dark: string;
  mid: string;
  light: string;
  snow: string;
  snowShade: string;
  haze: string;
  hazeAmount: number;
};

/**
 * One range of mountains as an image, w wide and h tall, its base at the
 * bottom, painted like the reference: flat palette-knife strokes, sunlit rock
 * on the left of each ridge and dark faces on the right, snow lying in long
 * streaks down the gullies, and haze over the distant ranges.
 */
export function mountainLayer(w: number, h: number, seed: number, col: MountainColours, opts: { peaks: number; dominant?: boolean; snow: number }) {
  const { c, g } = canvas(w, h, 1);
  const rand = seeded(seed);

  // the skyline: a row of peaks with hollow sides, roughened
  const peaks = Array.from({ length: opts.peaks }, (_, i) => ({
    x: w * ((i + 0.15 + rand() * 0.7) / opts.peaks),
    top: h * (0.18 + rand() * 0.4),
    half: w * (0.6 / opts.peaks) * (0.8 + rand() * 0.5),
  }));
  if (opts.dominant) {
    const main = peaks[Math.floor(opts.peaks / 2)];
    main.top = h * 0.02;
    main.half *= 1.5;
  }
  const N = 513;
  const noise = new Array(N).fill(0);
  {
    let step = N - 1;
    let rough = h * 0.12;
    while (step > 1) {
      const half = step / 2;
      for (let i = half; i < N; i += step) noise[i] = (noise[i - half] + noise[i + half]) / 2 + (rand() - 0.5) * rough;
      step = half;
      rough *= 0.6;
    }
  }
  const ridgeAt = (x: number) => {
    let y = h * 0.95;
    for (const pk of peaks) {
      const d = Math.abs(x - pk.x) / pk.half;
      if (d < 1) y = Math.min(y, pk.top + (h - pk.top) * Math.pow(d, 0.85));
    }
    const i = Math.max(0, Math.min(N - 1, Math.round((x / w) * (N - 1))));
    return Math.max(2, y + noise[i] * (y / h + 0.3));
  };

  // spurs: ridges running down from each summit; rock left of a spur faces the light
  const spurs: { x: number; y: number; dx: number }[] = [];
  for (const pk of peaks) {
    const sx = pk.x;
    const sy = ridgeAt(sx);
    const n = 3 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) spurs.push({ x: sx + (rand() - 0.5) * pk.half * 0.2, y: sy + rand() * (h - sy) * 0.15, dx: (rand() - 0.45) * pk.half * 1.4 });
  }
  const spurX = (s: (typeof spurs)[number], y: number) => s.x + (s.dx * Math.max(0, y - s.y)) / Math.max(1, h - s.y);

  const shape = new Path2D();
  shape.moveTo(0, h);
  for (let x = 0; x <= w; x += 2) shape.lineTo(x, ridgeAt(x));
  shape.lineTo(w, h);
  shape.closePath();
  g.fillStyle = col.mid;
  g.fill(shape);
  g.save();
  g.clip(shape);

  const paint = (count: number, size: number, purity: number, spread: number) => {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const top = ridgeAt(x);
    const y = top + rand() * (h - top);
    // nearest spur at this height
    let best = spurs[0];
    let bd = Infinity;
    for (const s of spurs) {
      if (y < s.y) continue;
      const d = Math.abs(spurX(s, y) - x);
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    const lit = x < spurX(best, y);
    const up = 1 - (y - top) / Math.max(1, h - top); // 1 at the skyline
    const high = 1 - y / h;
    // mostly along the spur (downhill), sometimes across it, like a palette knife
    const along = Math.atan2(h - best.y, best.dx);
    const angle = (rand() < 0.3 ? along + Math.PI / 2 : along) + (rand() - 0.5) * spread;
    let colour: string;
    const r = rand();
    if (high > 1 - opts.snow && r < (lit ? 0.38 : 0.18) * (0.5 + high) * (size < 2 ? 1 : 0.4)) colour = lit ? col.snow : col.snowShade;
    else if (lit) colour = r < purity * (0.8 + up * 0.2) ? col.light : col.mid;
    else colour = r < purity ? col.dark : col.mid;
    const len = (10 + rand() * 30) * (h / 400) * size;
    const wid = len * (0.25 + rand() * 0.3);
    // snow lies in long streaks
    const stretch = colour === col.snow || colour === col.snowShade ? 1.8 : 1;
    knife(g, x, y, len * stretch, wid, angle, (rand() - 0.5) * wid * 1.2, colour);
  }
  };
  // big strokes block in the faces, then smaller ones add the broken rock and snow
  paint(Math.floor((w * h) / 1400), 4, 0.94, 0.5);
  paint(Math.floor((w * h) / 380), 1, 0.75, 1.0);
  // haze over the distance, thickest at the foot
  if (col.hazeAmount > 0) {
    const hz = g.createLinearGradient(0, 0, 0, h);
    hz.addColorStop(0, `rgba(${col.haze},${col.hazeAmount * 0.6})`);
    hz.addColorStop(1, `rgba(${col.haze},${Math.min(1, col.hazeAmount * 1.4)})`);
    g.fillStyle = hz;
    g.fillRect(0, 0, w, h);
  }
  g.restore();
  return c;
}

// ---------- the night sky ----------
/**
 * A painted night sky, after the acrylic reference: a diagonal band of the
 * milky way in soft blue, violet and grey dabs, scattered with white dots and
 * little five-pointed stars. Transparent, to lay over the sky gradient.
 */
export function nightSky(w: number, h: number, seed: number) {
  const { c, g } = canvas(w, h, 1);
  const rand = seeded(seed);
  const tones = ["60,80,180", "90,100,200", "130,120,200", "170,160,210", "40,50,140", "120,150,230", "190,170,200"];
  // small, fairly opaque dabs, like acrylic paint pressed on with a round brush,
  // thickest along the middle of the band and thinning to the edges
  for (let i = 0; i < 5200; i++) {
    const t = rand();
    const x0 = w * (-0.1 + t * 1.2);
    const y0 = h * (0.95 - t * 0.85);
    const edge = (rand() + rand() + rand()) / 3 - 0.5; // clusters toward the middle
    const spread = edge * h * 0.5 * (0.6 + Math.sin(t * Math.PI) * 0.6);
    const r = 3 + rand() * 9;
    const x = x0 + spread * 0.5;
    const y = y0 + spread;
    const a = (0.1 + rand() * 0.22) * (1 - Math.abs(edge) * 1.4);
    if (a <= 0.02) continue;
    g.save();
    g.translate(x, y);
    g.rotate(rand() * Math.PI);
    g.scale(1 + rand() * 0.7, 1);
    const tone = tones[Math.floor(rand() * tones.length)];
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, `rgba(${tone},${a})`);
    grad.addColorStop(0.75, `rgba(${tone},${a * 0.9})`);
    grad.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  for (let i = 0; i < (w * h) / 900; i++) {
    g.fillStyle = `rgba(255,255,255,${0.4 + rand() * 0.6})`;
    g.beginPath();
    g.arc(rand() * w, rand() * h, 0.4 + rand() * 1.2, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < (w * h) / 26000; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 3 + rand() * 4;
    g.fillStyle = "rgba(255,255,255,0.95)";
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5 + (rand() - 0.5) * 0.15;
      const rr = k % 2 === 0 ? r : r * 0.45;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (k === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }
  return c;
}

// ---------- clouds ----------
const SHADOW = ["#7f82ab", "#8c8fb8", "#9496bd"];
const MID = ["#9fb0dc", "#aabbe6", "#a2b0de"];
const COOL_LIGHT = ["#c2d2f2", "#cddbf6"];
const LIGHT = ["#e6edfc", "#f2f5fe", "#ffffff"];
const WARM = ["#f8e2a8", "#f3cd8c", "#f6d79c"];
const RIM = ["#93d4f2", "#a6dcf5"];

/**
 * A heaped cumulus cloud painted like the references: flat, hard-edged brush
 * strokes, lavender-grey in the shadowed lower masses, blue in the body, white
 * where the light hits, warm gold on some sunlit tops and a cyan glow at the
 * turning edges.
 */
export function cloudBank(w: number, h: number, seed: number) {
  const { c, g } = canvas(w, h, 1);
  const rand = seeded(seed);
  const warm = seed % 2 === 0;
  const base = h * 0.9;
  const lx = -0.55;
  const ly = -0.83; // light from the upper left

  // billows heaped into one mound: tall in the middle, low at the ends
  const cx0 = w * (0.42 + rand() * 0.16);
  const H = h * 0.68;
  const hump = (x: number) =>
    Math.max(Math.exp(-(((x - cx0) / (w * 0.22)) ** 2)), 0.55 * Math.exp(-(((x - cx0 - w * 0.22) / (w * 0.14)) ** 2)), 0.2);
  const top = (x: number) => base - H * hump(x);
  const billows: { x: number; y: number; r: number }[] = [];
  for (let k = 0; k < 26; k++) {
    const x = w * (0.12 + rand() * 0.76);
    const r = h * (0.08 + rand() * 0.07) * (0.6 + hump(x) * 0.7);
    const y = Math.min(base - r * 0.35, top(x) + r * (0.9 + rand() * 1.8));
    // keep clear of the sides, strokes and all, so no billow is sliced off at the canvas edge
    const pad = r * 1.3 + 6;
    billows.push({ x: Math.max(pad, Math.min(w - pad, x)), y: Math.max(r + 4, y), r });
  }
  for (let k = 0; k < 12; k++) {
    const r = h * (0.1 + rand() * 0.04);
    billows.push({ x: w * (0.13 + (k / 11) * 0.74), y: base - r * 0.15, r });
  }
  // higher billows first, so the lower, darker masses overlap them
  billows.sort((a, b) => a.y - b.y);
  const pick = (a: string[]) => a[Math.floor(rand() * a.length)];
  // nothing goes below the base, so the cloud sits on a flat bottom
  // a gently ragged bottom edge, not a ruler-straight cut
  g.save();
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(w, 0);
  for (let x = w; x >= 0; x -= 6) g.lineTo(x, base + Math.sin(x * 0.045 + seed) * 3 + Math.sin(x * 0.13) * 2 - (rand() < 0.15 ? 4 : 0));
  g.closePath();
  g.clip();
  for (const b of billows) {
    const lift = 1 - b.y / base; // higher billows are lighter overall
    // a solid body underneath, so the strokes never leave gaps
    g.fillStyle = lift > 0.45 ? MID[1] : SHADOW[1];
    g.beginPath();
    g.arc(b.x, b.y, b.r * 0.86, 0, Math.PI * 2);
    g.fill();
    const n = Math.floor((b.r * b.r) / 30);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * b.r * 1.04;
      const x = b.x + Math.cos(a) * d;
      const y = b.y + Math.sin(a) * d;
      if (y > base + 2) continue;
      const nx = (x - b.x) / b.r;
      const ny = (y - b.y) / b.r;
      // the underside of the whole cloud sits in its own shadow
      const under = Math.max(0, (y - (base - h * 0.12)) / (h * 0.12));
      const L = nx * lx + ny * ly + lift * 0.9 - 0.35 - under * 0.9 + (rand() - 0.5) * 0.25;
      const edge = Math.hypot(nx, ny);
      let colour: string;
      if (edge > 0.82 && L > -0.25 && L < 0.35 && rand() < 0.35) colour = pick(RIM);
      else if (L > 0.75) colour = warm && lift > 0.35 ? pick(WARM) : pick(LIGHT);
      else if (L > 0.42) colour = pick(LIGHT);
      else if (L > 0.12) colour = pick(COOL_LIGHT);
      else if (L > -0.25) colour = pick(MID);
      else colour = pick(SHADOW);
      const len = b.r * (0.32 + rand() * 0.34);
      // strokes follow the curve of the billow
      slab(g, x, y, len, len * (0.45 + rand() * 0.35), Math.atan2(ny, nx) + Math.PI / 2 + (rand() - 0.5) * 0.8, colour);
    }
  }
  g.restore();
  // a couple of faint wisps streaming off to the side
  g.globalAlpha = 0.22;
  for (let i = 0; i < 3; i++) {
    const y = h * (0.45 + rand() * 0.3);
    slab(g, w * (0.08 + rand() * 0.1) + 40, y, 60 + rand() * 70, 2 + rand() * 2, -0.3 + (rand() - 0.5) * 0.2, pick(warm ? WARM : LIGHT));
  }
  g.globalAlpha = 1;
  return c;
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
