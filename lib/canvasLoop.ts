// Shared plumbing for the landing-page prototypes: a canvas that fills its box
// at the screen's pixel density, a pointer that works for mouse and touch, and
// an animation loop that pauses when the tab is hidden.

export type Pointer = {
  x: number;
  y: number;
  /** false once the pointer leaves the canvas (or a finger lifts) */
  inside: boolean;
  down: boolean;
  /** movement since the last frame, for dragging */
  dx: number;
  dy: number;
};

export type Tap = { x: number; y: number; t: number };

export type Frame = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  /** seconds since start */
  t: number;
  /** seconds since the last frame (capped) */
  dt: number;
  pointer: Pointer;
  taps: Tap[];
  reduced: boolean;
};

export function runCanvas(
  canvas: HTMLCanvasElement,
  draw: (f: Frame) => void,
  opts: { maxDpr?: number; onResize?: (w: number, h: number) => void } = {},
) {
  const ctx = canvas.getContext("2d")!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer: Pointer = { x: -9999, y: -9999, inside: false, down: false, dx: 0, dy: 0 };
  const taps: Tap[] = [];
  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let start = performance.now();
  let last = start;
  let downAt = { x: 0, y: 0, t: 0 };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    opts.onResize?.(w, h);
  };

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const move = (e: PointerEvent) => {
    const p = local(e);
    if (pointer.inside) {
      pointer.dx += p.x - pointer.x;
      pointer.dy += p.y - pointer.y;
    }
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = true;
  };
  const down = (e: PointerEvent) => {
    move(e);
    pointer.down = true;
    downAt = { ...local(e), t: performance.now() };
  };
  const up = (e: PointerEvent) => {
    const p = local(e);
    // a tap = a short press that barely moved
    if (pointer.down && performance.now() - downAt.t < 350 && Math.hypot(p.x - downAt.x, p.y - downAt.y) < 10) {
      taps.push({ x: p.x, y: p.y, t: (performance.now() - start) / 1000 });
    }
    pointer.down = false;
    if (e.pointerType !== "mouse") pointer.inside = false;
  };
  const leave = () => {
    pointer.inside = false;
    pointer.down = false;
  };

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw({ ctx, w, h, dpr, t: (now - start) / 1000, dt, pointer, taps, reduced });
    pointer.dx = 0;
    pointer.dy = 0;
    // forget taps after a few seconds
    while (taps.length && (now - start) / 1000 - taps[0].t > 4) taps.shift();
    raf = requestAnimationFrame(loop);
  };

  const visibility = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("pointercancel", leave);
  document.addEventListener("visibilitychange", visibility);
  raf = requestAnimationFrame(loop);
  start = performance.now();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerdown", down);
    window.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("pointercancel", leave);
    document.removeEventListener("visibilitychange", visibility);
  };
}

/** A small seeded random number generator, so the drawings look the same every visit. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
