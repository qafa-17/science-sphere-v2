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
/**
 * One ridge of mountains as an image, w wide and h tall, its base at the
 * bottom, painted like the fish: a gradient body, a lit edge along the ridge,
 * sunlit slopes on one side, fine ridge lines and speckles.
 */
export function mountainLayer(
  w: number,
  h: number,
  seed: number,
  colours: { top: string; bottom: string; light: string; shadow: string },
  jag: number,
) {
  const { c, g } = canvas(w, h, 1);
  const rand = seeded(seed);

  // the ridge: a row of pointed peaks, each one a tent with slightly hollow
  // sides, plus a little small-scale roughness on top
  const count = 3 + Math.floor(rand() * 3);
  const peaks = Array.from({ length: count }, (_, i) => ({
    x: w * ((i + 0.15 + rand() * 0.7) / count),
    top: h * (0.12 + rand() * 0.45),
    half: w * (0.17 + rand() * 0.16),
  }));
  const N = 513;
  const noise = new Array(N).fill(0);
  {
    let step = N - 1;
    let rough = h * 0.06 * jag * 2;
    while (step > 1) {
      const half = step / 2;
      for (let i = half; i < N; i += step) noise[i] = (noise[i - half] + noise[i + half]) / 2 + (rand() - 0.5) * rough;
      step = half;
      rough *= 0.55;
    }
  }
  const tent = (x: number, pk: (typeof peaks)[number]) => {
    const d = Math.abs(x - pk.x) / pk.half;
    if (d >= 1) return h;
    return pk.top + (h - pk.top) * Math.pow(d, 0.95);
  };
  const ridgeAt = (x: number) => {
    let y = h * 0.92;
    for (const pk of peaks) y = Math.min(y, tent(x, pk));
    const i = Math.max(0, Math.min(N - 1, Math.round((x / w) * (N - 1))));
    return Math.max(2, y + noise[i]);
  };
  const shape = new Path2D();
  shape.moveTo(0, h);
  for (let x = 0; x <= w; x += 2) shape.lineTo(x, ridgeAt(x));
  shape.lineTo(w, h);
  shape.closePath();

  const body = g.createLinearGradient(0, h * 0.1, 0, h);
  body.addColorStop(0, colours.top);
  body.addColorStop(1, colours.bottom);
  g.fillStyle = body;
  g.fill(shape);

  g.save();
  g.clip(shape);
  // each peak: the face away from the light (right) in shadow, cut by a crease
  // that runs from the summit down and to the right; the left face catches light
  for (const pk of peaks.slice().sort((a2, b2) => b2.top - a2.top)) {
    const P = { x: pk.x, y: ridgeAt(pk.x) };
    const creaseX = P.x + pk.half * (0.15 + rand() * 0.2);
    const shade = new Path2D();
    shade.moveTo(P.x, P.y);
    for (let x = P.x; x <= P.x + pk.half; x += 2) shade.lineTo(x, ridgeAt(x));
    shade.lineTo(P.x + pk.half, h);
    shade.lineTo(creaseX, h);
    shade.closePath();
    const sg = g.createLinearGradient(P.x, P.y, P.x + pk.half * 0.4, h);
    sg.addColorStop(0, colours.shadow);
    sg.addColorStop(1, "rgba(0,0,0,0.04)");
    g.fillStyle = sg;
    g.fill(shade);
    const lit = new Path2D();
    lit.moveTo(P.x, P.y);
    for (let x = P.x; x >= P.x - pk.half * 0.8; x -= 2) lit.lineTo(x, ridgeAt(x));
    lit.lineTo(P.x - pk.half * 0.5, P.y + (h - P.y) * 0.6);
    lit.lineTo(P.x + (creaseX - P.x) * 0.3, P.y + (h - P.y) * 0.4);
    lit.closePath();
    const lg = g.createLinearGradient(0, P.y, 0, P.y + (h - P.y) * 0.6);
    lg.addColorStop(0, colours.light);
    lg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lg;
    g.globalAlpha = 0.5;
    g.fill(lit);
    g.globalAlpha = 1;
    // fine gullies running down the faces, like the lines on the fish
    g.lineCap = "round";
    for (let k = 0; k < 7; k++) {
      const sx = P.x + (rand() - 0.5) * pk.half * 0.9;
      const sy = ridgeAt(sx) + 2;
      const len = (h - sy) * (0.15 + rand() * 0.3);
      const drift = (sx - P.x) * 0.35;
      g.strokeStyle = sx > P.x ? `rgba(255,255,255,${0.06 + rand() * 0.08})` : `rgba(255,255,255,${0.12 + rand() * 0.12})`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(sx + drift * 0.4, sy + len * 0.5, sx + drift, sy + len);
      g.stroke();
    }
  }
  // speckles, denser near the top
  for (let i = 0; i < (w * h) / 90; i++) {
    const x = rand() * w;
    const top = ridgeAt(x);
    const y = top + Math.pow(rand(), 2) * (h - top);
    g.fillStyle = rand() < 0.7 ? `rgba(255,255,255,${0.12 + rand() * 0.3})` : "rgba(5,10,40,0.25)";
    g.beginPath();
    g.arc(x, y, 0.3 + rand() * 0.8, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // a thin lit edge along the ridge, like the sheen along a fish's back
  g.strokeStyle = colours.light;
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = 0; x <= w; x += 2) {
    const y = ridgeAt(x) + 0.7;
    if (x === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
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
  // a few speckles, so they sit with the fish and mountains
  g.globalCompositeOperation = "source-atop";
  for (let i = 0; i < (w * h) / 300; i++) {
    g.fillStyle = `rgba(255,255,255,${0.1 + rand() * 0.25})`;
    g.fillRect(rand() * w, rand() * h, 1, 1);
  }
  g.globalCompositeOperation = "source-over";
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
