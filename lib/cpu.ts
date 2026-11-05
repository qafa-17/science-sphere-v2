// The CPU cursor's drawing, in its own units. The chip sits at (0, 0).
// Change the traces here to change where the circuit lines run.

/** Half the width of the chip body. */
export const BODY = 12;
/** Where the pins stop sticking out. */
export const PIN_TIP = 15;
/** Pin positions along each side. */
export const PINS = [-10, -6, -2, 2, 6, 10];

export type Pad = "dot" | "ring" | "chip";
export type Trace = { points: [number, number][]; end: Pad };

// 18 traces in all. They leave the chip straight,
// bend outward together (so they fan out without crossing), then run on.
const SIDES: { out: [number, number]; along: [number, number] }[] = [
  { out: [0, -1], along: [1, 0] }, // top
  { out: [1, 0], along: [0, 1] }, // right
  { out: [0, 1], along: [-1, 0] }, // bottom
  { out: [-1, 0], along: [0, -1] }, // left
];

// Each side has its own character, so the circuit isn't symmetrical:
// which pins carry a trace, how far out they bend, how sharply they fan out,
// how long they run, and what they end in.
type SideSpec = { pins: number[]; bend: number; spread: number; lengths: number[]; ends: Pad[] };
const SIDE_SPECS: SideSpec[] = [
  // top: three long traces fanning wide
  { pins: [0, 2, 5], bend: 3, spread: 1.3, lengths: [26, 34, 22], ends: ["chip", "ring", "dot"] },
  // right: five short, tight, straight-ish runs
  { pins: [0, 1, 2, 3, 4], bend: 8, spread: 0.3, lengths: [8, 14, 6, 12, 9], ends: ["dot", "dot", "ring", "dot", "chip"] },
  // bottom: six, alternating long and short, gentle fan
  { pins: [0, 1, 2, 3, 4, 5], bend: 5, spread: 0.7, lengths: [18, 6, 24, 9, 20, 5], ends: ["ring", "dot", "dot", "chip", "dot", "dot"] },
  // left: four, bending late and steeply, uneven
  { pins: [1, 2, 4, 5], bend: 11, spread: 1.0, lengths: [16, 28, 10, 20], ends: ["dot", "chip", "ring", "dot"] },
];

function buildTraces(): Trace[] {
  const traces: Trace[] = [];
  SIDES.forEach(({ out, along }, side) => {
    const spec = SIDE_SPECS[side];
    spec.pins.forEach((pin, k) => {
      const o = PINS[pin];
      const at = (d: number, t: number): [number, number] => [
        +(out[0] * d + along[0] * t).toFixed(2),
        +(out[1] * d + along[1] * t).toFixed(2),
      ];
      const bendAt = PIN_TIP + spec.bend;
      const spread = o * spec.spread;
      const diag = Math.abs(spread);
      const end = bendAt + diag + spec.lengths[k];
      traces.push({
        points: [at(PIN_TIP, o), at(bendAt, o), at(bendAt + diag, o + spread), at(end, o + spread)],
        end: spec.ends[k],
      });
    });
  });
  return traces;
}

export const TRACES = buildTraces();

/** On-screen size of the whole drawing (the chip itself is about a fifth of this, ~15px). */
export const CURSOR_PX = 79;
/** The drawing's size in its own units. */
export const VIEW = 124;

/** Things that count as clickable, so the circuit forms over them. */
export const CLICKABLE =
  'a, button, [role="button"], label, select, summary, input[type="checkbox"], input[type="radio"], input[type="submit"], [data-clickable]';
