// A card made of particles. The real card stays in the page (its links work,
// screen readers read it) but its text is invisible; this draws every letter,
// line and button outline of it as small dots instead. The dots fly in to form
// the card, scatter away from the pointer and drift back, and blow apart as you
// scroll past.

type Dot = {
  hx: number; // home: where it sits in the card
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number; // where it flies in from / out to (an offset from home)
  oy: number;
  r: number; // 0..1, staggers each dot's timing
  dim: boolean; // labels are drawn a little fainter
  s: number; // dot size
};

export type ParticleCard = {
  /** read the card's layout and turn it into dots (call again after a resize) */
  build: (el: HTMLElement, stage: DOMRect, scale?: number) => void;
  /** assemble: 0 = scattered, 1 = formed; disperse: 0 = formed, 1 = blown away */
  step: (dt: number, assemble: number, disperse: number, pointer: { x: number; y: number; inside: boolean }) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  readonly count: number;
};

const STRETCH: [number, CanvasFontStretch][] = [
  [50, "ultra-condensed"],
  [62.5, "extra-condensed"],
  [75, "condensed"],
  [87.5, "semi-condensed"],
  [100, "normal"],
  [112.5, "semi-expanded"],
  [125, "expanded"],
  [150, "extra-expanded"],
  [200, "ultra-expanded"],
];
function stretchKeyword(css: string): CanvasFontStretch {
  const pct = parseFloat(css);
  if (Number.isNaN(pct)) return (STRETCH.find(([, k]) => k === css)?.[1] ?? "normal") as CanvasFontStretch;
  return STRETCH.reduce((best, cur) => (Math.abs(cur[0] - pct) < Math.abs(best[0] - pct) ? cur : best))[1];
}

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - (1 - x) ** 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function createParticleCard(colour = "238,242,255"): ParticleCard {
  let dots: Dot[] = [];
  let size = 1.6;
  let alpha = 1;
  let panel: { x: number; y: number; w: number; h: number } | null = null;
  let rand = 1;
  const random = () => {
    // small seeded generator, so the card scatters the same way each visit
    rand = (rand * 16807) % 2147483647;
    return (rand - 1) / 2147483646;
  };

  const scratch = typeof document !== "undefined" ? document.createElement("canvas") : null;

  /** dots for the inked pixels of one element's words, sampled every `step` px */
  function sampleText(el: HTMLElement, stage: DOMRect, step: number, dim: boolean) {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height || !scratch) return;
    const style = getComputedStyle(el);
    const W = Math.ceil(box.width) + 4;
    const H = Math.ceil(box.height) + 4;
    scratch.width = W;
    scratch.height = H;
    const g = scratch.getContext("2d", { willReadFrequently: true })!;
    g.clearRect(0, 0, W, H);
    g.fillStyle = "#000";
    // canvas fonts take the width as a keyword, not the percentage CSS reports
    g.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    g.fontStretch = stretchKeyword(style.fontStretch);
    g.textBaseline = "alphabetic";
    // each word where the browser actually laid it out, so wrapped lines match
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      const transform = getComputedStyle(node.parentElement!).textTransform;
      const re = /\S+/g;
      for (let m = re.exec(text); m; m = re.exec(text)) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rects = range.getClientRects();
        if (!rects.length) continue;
        const rc = rects[0];
        const word = transform === "uppercase" ? m[0].toUpperCase() : m[0];
        const metrics = g.measureText(word);
        // place the text's baseline where the browser put it
        const ascent = metrics.fontBoundingBoxAscent ?? rc.height * 0.8;
        const descent = metrics.fontBoundingBoxDescent ?? rc.height * 0.2;
        const baseline = rc.top - box.top + (rc.height - (ascent + descent)) / 2 + ascent;
        // squeeze or stretch to the browser's width, in case the canvas font differs a touch
        const sx = metrics.width > 0 ? rc.width / metrics.width : 1;
        g.save();
        g.translate(rc.left - box.left + 2, baseline + 2);
        g.scale(sx, 1);
        g.fillText(word, 0, 0);
        g.restore();
      }
    }
    const data = g.getImageData(0, 0, W, H).data;
    // one dot per little cell that has enough ink in it, so thin strokes aren't lost between samples
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        let ink = 0;
        let n = 0;
        for (let yy = Math.floor(y); yy < Math.min(H, Math.floor(y + step)); yy++) {
          for (let xx = Math.floor(x); xx < Math.min(W, Math.floor(x + step)); xx++) {
            ink += data[(yy * W + xx) * 4 + 3];
            n++;
          }
        }
        if (n && ink / n > 70) add(box.left - stage.left + x - 2, box.top - stage.top + y - 2, dim, step * 0.82);
      }
    }
  }

  /** dots along a rectangle's edge */
  function sampleOutline(el: HTMLElement, stage: DOMRect, step: number, dim: boolean) {
    const b = el.getBoundingClientRect();
    const add = (x: number, y: number, d: boolean) => addDot(x, y, d, size);
    const x0 = b.left - stage.left;
    const y0 = b.top - stage.top;
    for (let x = 0; x <= b.width; x += step) {
      add(x0 + x, y0, dim);
      add(x0 + x, y0 + b.height, dim);
    }
    for (let y = step; y < b.height; y += step) {
      add(x0, y0 + y, dim);
      add(x0 + b.width, y0 + y, dim);
    }
  }

  function addDot(hx: number, hy: number, dim: boolean, s: number) {
    const a = random() * Math.PI * 2;
    const far = 250 + random() * 650;
    dots.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, ox: Math.cos(a) * far, oy: Math.sin(a) * far, r: random(), dim, s });
  }
  const add = addDot;

  return {
    get count() {
      return dots.length;
    },

    build(el, stage, scale = 1) {
      dots = [];
      rand = 7;
      const b = el.getBoundingClientRect();
      panel = { x: b.left - stage.left, y: b.top - stage.top, w: b.width, h: b.height };
      const fine = (px: number) => Math.max(1.25, Math.min(3, px / 10)) * scale;
      size = 1.5 * Math.min(1.3, scale);
      sampleOutline(el, stage, 3 * scale, true);
      el.querySelectorAll<HTMLElement>("[data-dots]").forEach((part) => {
        const kind = part.dataset.dots;
        const fontPx = parseFloat(getComputedStyle(part).fontSize) || 16;
        if (kind === "button") sampleOutline(part, stage, 2.5 * scale, false);
        sampleText(part, stage, fine(fontPx), kind === "dim");
      });
      // start scattered
      for (const d of dots) {
        d.x = d.hx + d.ox;
        d.y = d.hy + d.oy;
      }
    },

    step(dt, assemble, disperse, pointer) {
      const k = 70; // spring towards where each dot should be
      const damp = Math.exp(-9 * dt);
      const R = 120; // how far the pointer reaches
      // stay visible while flying apart, fading only toward the end
      alpha = clamp01(assemble * 1.4) * (1 - clamp01((disperse - 0.35) / 0.65));
      for (const d of dots) {
        // each dot arrives and leaves on its own little delay, so the card sweeps in and out
        const inAmt = ease(clamp01((assemble - d.r * 0.35) / 0.65));
        const outAmt = ease(clamp01((disperse - d.r * 0.3) / 0.7));
        const off = 1 - inAmt + outAmt * 1.4;
        const tx = d.hx + d.ox * off;
        const ty = d.hy + d.oy * off - outAmt * 120;
        d.vx += (tx - d.x) * k * dt;
        d.vy += (ty - d.y) * k * dt;
        if (pointer.inside) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < R && dist > 0.01) {
            const push = (1 - dist / R) ** 2 * 4200 * dt;
            d.vx += (dx / dist) * push + (d.r - 0.5) * push * 0.6;
            d.vy += (dy / dist) * push + (d.r - 0.5) * push * 0.6;
          }
        }
        d.vx *= damp;
        d.vy *= damp;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
      }
    },

    draw(ctx) {
      if (alpha < 0.01 || !dots.length) return;
      // a soft dark pane behind the card, so it reads over the stars and the fish
      if (panel) {
        // an ellipse that fades out well before its edge, so no corners show
        const cx = panel.x + panel.w / 2;
        const cy = panel.y + panel.h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(panel.w / panel.h, 1);
        const R = panel.h * 0.85;
        const g = ctx.createRadialGradient(0, 0, R * 0.35, 0, 0, R);
        g.addColorStop(0, `rgba(4,8,32,${0.6 * alpha})`);
        g.addColorStop(1, "rgba(4,8,32,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-R, -R, R * 2, R * 2);
        ctx.restore();
      }
      for (const dim of [false, true]) {
        ctx.fillStyle = `rgba(${colour},${alpha * (dim ? 0.62 : 1)})`;
        ctx.beginPath();
        for (const d of dots) if (d.dim === dim) ctx.rect(d.x, d.y, d.s, d.s);
        ctx.fill();
      }
    },
  };
}
