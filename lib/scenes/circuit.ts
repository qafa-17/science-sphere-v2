// The circuit board (prototype 03), as a scene that can zoom out from its chip and fade.
import { type Frame, seeded } from "../canvasLoop";

type Trace = {
  pts: { x: number; y: number }[];
  len: number;
  at: number[];
  fromChip: boolean;
  end: "dot" | "ring" | "pad";
  pulses: number[];
  lit: number;
};

const DIRS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

export type CircuitOpts = {
  alpha?: number;
  /** 1 = normal; smaller shrinks the board into its chip */
  zoom?: number;
  /** show the chip in the middle */
  chip?: boolean;
  /** 0..1 how much of each trace is drawn, from the chip outward */
  grow?: number;
};

export function createCircuit() {
  let traces: Trace[] = [];
  let G = 22;
  let chip = { x: 0, y: 0, half: 0 };
  let flash = 0;
  let lastBurst = -1;

  function resize(w: number, h: number) {
    const rand = seeded(23);
    G = w < 700 ? 18 : 22;
    const cols = Math.ceil(w / G) + 1;
    const rows = Math.ceil(h / G) + 1;
    const used = new Uint8Array(cols * rows);
    const take = (c: number, r: number) => {
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
      if (used[r * cols + c]) return false;
      used[r * cols + c] = 1;
      return true;
    };
    const cc = Math.round(cols / 2);
    const cr = Math.round(rows / 2.1);
    const halfCells = w < 700 ? 2 : 3;
    chip = { x: cc * G, y: cr * G, half: halfCells * G + 6 };
    for (let r = cr - halfCells - 1; r <= cr + halfCells + 1; r++)
      for (let c = cc - halfCells - 1; c <= cc + halfCells + 1; c++)
        if (c >= 0 && r >= 0 && c < cols && r < rows) used[r * cols + c] = 1;

    const walk = (c: number, r: number, dir: number, maxSteps: number, fromChip: boolean, start?: { x: number; y: number }) => {
      const pts = start ? [start, { x: c * G, y: r * G }] : [{ x: c * G, y: r * G }];
      let steps = 0;
      let straight = 0;
      while (steps < maxSteps) {
        let next = dir;
        if (straight > 2 && rand() < 0.22) next = (dir + (rand() < 0.5 ? 1 : 7)) % 8;
        const [dx, dy] = DIRS[next];
        if (!take(c + dx, r + dy)) {
          const [ax, ay] = DIRS[dir];
          if (next !== dir && take(c + ax, r + ay)) {
            c += ax;
            r += ay;
          } else break;
        } else {
          c += dx;
          r += dy;
          if (next !== dir) {
            dir = rand() < 0.5 ? next : dir;
            straight = 0;
          }
        }
        straight++;
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const p = { x: c * G, y: r * G };
        if (prev && Math.sign(p.x - last.x) === Math.sign(last.x - prev.x) && Math.sign(p.y - last.y) === Math.sign(last.y - prev.y))
          pts[pts.length - 1] = p;
        else pts.push(p);
        steps++;
      }
      if (pts.length < 2 || steps < 3) return;
      const at = [0];
      for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const r3 = rand();
      traces.push({ pts, at, len: at[at.length - 1], fromChip, end: r3 < 0.45 ? "dot" : r3 < 0.75 ? "ring" : "pad", pulses: [], lit: 0 });
    };

    traces = [];
    for (let k = -halfCells; k <= halfCells; k++) {
      const len = () => 6 + Math.floor(rand() * 26);
      walk(cc + k, cr - halfCells - 2, 6, len(), true, { x: (cc + k) * G, y: chip.y - chip.half });
      walk(cc + k, cr + halfCells + 2, 2, len(), true, { x: (cc + k) * G, y: chip.y + chip.half });
      walk(cc - halfCells - 2, cr + k, 4, len(), true, { x: chip.x - chip.half, y: (cr + k) * G });
      walk(cc + halfCells + 2, cr + k, 0, len(), true, { x: chip.x + chip.half, y: (cr + k) * G });
    }
    for (let i = 0; i < 260; i++) {
      const c = Math.floor(rand() * cols);
      const r = Math.floor(rand() * rows);
      if (!take(c, r)) continue;
      walk(c, r, Math.floor(rand() * 4) * 2, 4 + Math.floor(rand() * 14), false);
    }
  }

  const pointAt = (tr: Trace, d: number) => {
    let i = 1;
    while (i < tr.at.length - 1 && tr.at[i] < d) i++;
    const a = tr.pts[i - 1];
    const b = tr.pts[i];
    const seg = tr.at[i] - tr.at[i - 1] || 1;
    const k = Math.min(1, Math.max(0, (d - tr.at[i - 1]) / seg));
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  };

  const distTo = (tr: Trace, x: number, y: number) => {
    let best = Infinity;
    for (let i = 1; i < tr.pts.length; i++) {
      const a = tr.pts[i - 1];
      const b = tr.pts[i];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const l2 = vx * vx + vy * vy || 1;
      const k = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / l2));
      best = Math.min(best, Math.hypot(a.x + vx * k - x, a.y + vy * k - y));
    }
    return best;
  };

  function draw(f: Frame, o: CircuitOpts = {}) {
    const { ctx, w, h, dt, pointer, taps, reduced } = f;
    const alpha = o.alpha ?? 1;
    if (alpha <= 0.001) return;
    const zoom = o.zoom ?? 1;
    const grow = o.grow ?? 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#18314F";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(chip.x, chip.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-chip.x, -chip.y);
    // the pointer, in board coordinates
    const px = (pointer.x - chip.x) / zoom + chip.x;
    const py = (pointer.y - chip.y) / zoom + chip.y;

    ctx.fillStyle = "rgba(139,190,178,0.12)";
    for (let y = 0; y < h; y += G) for (let x = 0; x < w; x += G) ctx.fillRect(x - 0.5, y - 0.5, 1, 1);

    const newest = taps[taps.length - 1];
    if (newest && newest.t !== lastBurst) {
      lastBurst = newest.t;
      flash = 1;
      for (const tr of traces) if (tr.fromChip || Math.hypot(tr.pts[0].x - px, tr.pts[0].y - py) < 260) tr.pulses.push(0);
    }
    flash = Math.max(0, flash - dt * 1.5);

    let probe: { x: number; y: number; d: number } | null = null;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const tr of traces) {
      const d = pointer.inside ? distTo(tr, px, py) : Infinity;
      tr.lit += (Math.max(0, 1 - d / 110) - tr.lit) * Math.min(1, dt * 8);
      if (!reduced) {
        const rate = (tr.fromChip ? 0.18 : 0.03) + tr.lit * 2.2;
        if (Math.random() < rate * dt) tr.pulses.push(0);
      }
      const speed = 240 + tr.lit * 160;
      tr.pulses = tr.pulses.map((p) => p + speed * dt).filter((p) => p < tr.len + 20);

      // only the part of the trace that has "grown" so far
      const shown = tr.len * Math.max(0, Math.min(1, grow * 1.3 - (tr.fromChip ? 0 : 0.3)));
      if (shown <= 0) continue;
      const base = tr.fromChip ? 0.55 : 0.28;
      ctx.strokeStyle = tr.lit > 0.02 ? `rgba(230,249,175,${base + tr.lit * 0.45})` : `rgba(139,190,178,${base})`;
      ctx.lineWidth = tr.fromChip ? 1.6 : 1.1;
      ctx.beginPath();
      ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
      for (let i = 1; i < tr.pts.length && tr.at[i - 1] < shown; i++) {
        const q = tr.at[i] <= shown ? tr.pts[i] : pointAt(tr, shown);
        ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      if (shown < tr.len) continue;

      const e = tr.pts[tr.pts.length - 1];
      const padCol =
        tr.lit > 0.05 ? `rgba(230,249,175,${0.6 + tr.lit * 0.4})` : tr.fromChip ? "rgba(202,172,75,0.85)" : "rgba(139,190,178,0.5)";
      if (tr.end === "ring") {
        ctx.strokeStyle = padCol;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 3.4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = padCol;
        if (tr.end === "pad") ctx.fillRect(e.x - 3.5, e.y - 3.5, 7, 7);
        else {
          ctx.beginPath();
          ctx.arc(e.x, e.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (pointer.inside) {
        const pd = Math.hypot(e.x - px, e.y - py);
        if (pd < 170 && (!probe || pd < probe.d)) probe = { x: e.x, y: e.y, d: pd };
      }
      for (const p of tr.pulses) {
        const head = pointAt(tr, Math.min(p, tr.len));
        const tail = pointAt(tr, Math.max(0, p - 26));
        const g = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        g.addColorStop(0, "rgba(230,249,175,0)");
        g.addColorStop(1, "rgba(230,249,175,0.95)");
        ctx.strokeStyle = g;
        ctx.lineWidth = tr.fromChip ? 2.6 : 2;
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();
      }
    }

    if (probe) {
      const k = 1 - probe.d / 170;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = `rgba(202,172,75,${0.9 * k})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(probe.x, probe.y);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(230,249,175,${0.25 * k})`;
      ctx.beginPath();
      ctx.arc(probe.x, probe.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (o.chip !== false) drawChip(ctx, chip.x, chip.y, chip.half, G, flash);
    ctx.restore();
  }

  /** the end pads' screen positions (at zoom 1), chip traces first */
  const points = () =>
    traces
      .slice()
      .sort((a, b) => Number(b.fromChip) - Number(a.fromChip))
      .map((tr) => tr.pts[tr.pts.length - 1]);

  return { draw, resize, points, chip: () => chip };
}

function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, G: number, flash: number) {
  const lime = "rgba(230,249,175,1)";
  ctx.fillStyle = lime;
  const n = Math.round((half - 6) / G);
  for (let k = -n; k <= n; k++) {
    const p = k * G;
    ctx.fillRect(x + p - 3, y - half - 7, 6, 9);
    ctx.fillRect(x + p - 3, y + half - 2, 6, 9);
    ctx.fillRect(x - half - 7, y + p - 3, 9, 6);
    ctx.fillRect(x + half - 2, y + p - 3, 9, 6);
  }
  ctx.fillStyle = flash > 0 ? `rgba(${13 + flash * 60},${6 + flash * 80},${48 + flash * 40},1)` : "#0D0630";
  ctx.strokeStyle = lime;
  ctx.lineWidth = 3;
  roundRect(ctx, x - half, y - half, half * 2, half * 2, 8);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.5;
  const d = half * 0.62;
  roundRect(ctx, x - d, y - d, d * 2, d * 2, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - d + 10, y - d + 10, 3, 0, Math.PI * 2);
  ctx.fillStyle = lime;
  ctx.fill();
  ctx.font = `700 ${Math.max(9, half * 0.13)}px "Space Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCI_SPHERE", x, y + 2);
  ctx.globalAlpha *= 0.6;
  ctx.font = `${Math.max(8, half * 0.1)}px "Space Mono", monospace`;
  ctx.fillText("MRU-003", x, y + half * 0.28);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
