// The network sphere (prototype 01), as a scene other pages can place, zoom and fade.
import { type Frame, seeded } from "../canvasLoop";

const N = 240;
const REACH = 130;
const LINK = 95;

export type SphereOpts = {
  alpha?: number;
  cx?: number;
  cy?: number;
  /** radius in px; defaults to 36% of the shorter side */
  radius?: number;
  /** draw the starry background behind it */
  background?: boolean;
  /** 0..1: lines and dots fade toward the edge, for flying through it */
  through?: number;
};

export function createSphere() {
  const rand = seeded(17);
  const pts = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, size: 0.8 + rand() * 1.4, gold: rand() < 0.12 };
  });
  const edges = new Set<string>();
  pts.forEach((p, i) => {
    pts
      .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .forEach(({ j }) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  for (let k = 0; k < 70; k++) {
    const i = Math.floor(rand() * N);
    const j = Math.floor(rand() * N);
    const d = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2 + (pts[i].z - pts[j].z) ** 2;
    if (i !== j && d < 0.9) edges.add(i < j ? `${i}-${j}` : `${j}-${i}`);
  }
  const links = [...edges].map((e) => e.split("-").map(Number) as [number, number]);
  const stars = Array.from({ length: 140 }, () => ({ x: rand(), y: rand(), s: rand() }));

  let spinY = 0;
  let spinX = -0.35;
  let velY = 0.12;
  let velX = 0;
  const proj: { X: number; Y: number; z: number; near: number; wave: number }[] = pts.map(() => ({
    X: 0,
    Y: 0,
    z: 0,
    near: 0,
    wave: 0,
  }));

  function draw(f: Frame, o: SphereOpts = {}) {
    const { ctx, w, h, t, dt, pointer, taps, reduced } = f;
    const alpha = o.alpha ?? 1;
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (o.background !== false) {
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#18314F");
      bg.addColorStop(1, "#0D0630");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        ctx.fillStyle = `rgba(230,249,175,${0.15 + 0.35 * s.s * (reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 1.5 + s.s * 20))})`;
        ctx.fillRect(s.x * w, s.y * h, 1.2, 1.2);
      }
    }

    if (pointer.down) {
      velY = pointer.dx * 0.35;
      velX = -pointer.dy * 0.35;
    } else {
      velY += (0.12 - velY) * Math.min(1, dt * 1.2);
      velX += (0 - velX) * Math.min(1, dt * 2);
    }
    if (!reduced || pointer.down) {
      spinY += velY * dt;
      spinX = Math.max(-1.2, Math.min(1.2, spinX + velX * dt));
    }

    const R = o.radius ?? Math.min(w, h) * 0.36;
    const cx = o.cx ?? w / 2;
    const cy = o.cy ?? h / 2;
    const through = o.through ?? 0;
    const cyA = Math.cos(spinY);
    const syA = Math.sin(spinY);
    const cxA = Math.cos(spinX);
    const sxA = Math.sin(spinX);

    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const x1 = p.x * cyA + p.z * syA;
      const z1 = -p.x * syA + p.z * cyA;
      const y2 = p.y * cxA - z1 * sxA;
      const z2 = p.y * sxA + z1 * cxA;
      const s = 3 / (3 - z2);
      let X = cx + x1 * R * s;
      let Y = cy + y2 * R * s;
      let wave = 0;
      for (const tap of taps) {
        const age = Math.max(0, t - tap.t);
        const d = Math.hypot(X - tap.x, Y - tap.y);
        const k = Math.max(0, 1 - Math.abs(d - age * 520) / 60) * Math.max(0, 1 - age / 1.6);
        if (k > 0 && d > 0) {
          X += ((X - tap.x) / d) * k * 22;
          Y += ((Y - tap.y) / d) * k * 22;
          wave = Math.max(wave, k);
        }
      }
      let near = 0;
      if (pointer.inside) {
        const d = Math.hypot(X - pointer.x, Y - pointer.y);
        if (d < REACH) {
          near = 1 - d / REACH;
          const pull = near * near * 26;
          X += ((pointer.x - X) / (d || 1)) * pull * (z2 > 0 ? 1 : 0.4);
          Y += ((pointer.y - Y) / (d || 1)) * pull * (z2 > 0 ? 1 : 0.4);
        }
      }
      const P = proj[i];
      P.X = X;
      P.Y = Y;
      P.z = z2;
      P.near = near;
      P.wave = wave;
    }

    // when flying through, things far from the middle fade so the centre stays clear
    const fade = (X: number, Y: number) => (through > 0 ? Math.max(0, 1 - through * (Math.hypot(X - cx, Y - cy) / Math.max(w, h))) : 1);

    ctx.lineWidth = 0.7;
    for (const [a, b] of links) {
      const A = proj[a];
      const B = proj[b];
      const depth = (A.z + B.z) / 2;
      const glow = Math.max(A.near, B.near, A.wave, B.wave);
      const al = (0.08 + 0.32 * ((depth + 1) / 2) + glow * 0.5) * fade((A.X + B.X) / 2, (A.Y + B.Y) / 2);
      ctx.strokeStyle = glow > 0.05 ? `rgba(230,249,175,${al})` : `rgba(139,190,178,${al})`;
      ctx.beginPath();
      ctx.moveTo(A.X, A.Y);
      ctx.lineTo(B.X, B.Y);
      ctx.stroke();
    }

    if (pointer.inside && through < 0.3) {
      ctx.lineWidth = 0.8;
      for (const P of proj) {
        if (P.z < 0) continue;
        const d = Math.hypot(P.X - pointer.x, P.Y - pointer.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(202,172,75,${(1 - d / LINK) * 0.9})`;
          ctx.beginPath();
          ctx.moveTo(P.X, P.Y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    const order = proj.map((_, i) => i).sort((a, b) => proj[a].z - proj[b].z);
    const grow = Math.max(1, R / (Math.min(w, h) * 0.36));
    for (const i of order) {
      const P = proj[i];
      const p = pts[i];
      const depth = (P.z + 1) / 2;
      const r = p.size * (0.6 + depth * 0.8) * (1 + P.near * 1.4 + P.wave) * Math.min(3, Math.sqrt(grow));
      const f2 = fade(P.X, P.Y);
      ctx.fillStyle = p.gold
        ? `rgba(202,172,75,${(0.3 + depth * 0.7) * f2})`
        : `rgba(230,249,175,${(0.2 + depth * 0.75 + P.near * 0.3) * f2})`;
      ctx.beginPath();
      ctx.arc(P.X, P.Y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (through < 0.2) {
      ctx.strokeStyle = "rgba(139,190,178,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const tap of taps) {
      const age = Math.max(0, t - tap.t);
      if (age > 1.6) continue;
      ctx.strokeStyle = `rgba(230,249,175,${0.5 * (1 - age / 1.6)})`;
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, age * 520, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** where each dot was last drawn, front ones first */
  const points = () =>
    proj
      .map((p, i) => ({ x: p.X, y: p.Y, z: p.z, i }))
      .sort((a, b) => b.z - a.z);

  return { draw, points };
}
