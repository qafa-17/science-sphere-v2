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

// Five pins on each side get a trace (20 in all). They leave the chip straight,
// all bend outward at the same distance (so they fan out without crossing),
// then run on for different lengths.
const LENGTHS = [16, 26, 10, 30, 14, 22, 20, 12, 28, 18, 24, 8, 12, 30, 20, 16, 26, 10, 22, 14, 28, 18, 10, 24];
const ENDS: Pad[] = ["dot", "ring", "chip", "dot", "dot", "ring", "chip", "dot"];
const SIDES: { out: [number, number]; along: [number, number] }[] = [
  { out: [0, -1], along: [1, 0] }, // top
  { out: [1, 0], along: [0, 1] }, // right
  { out: [0, 1], along: [-1, 0] }, // bottom
  { out: [-1, 0], along: [0, -1] }, // left
];

function buildTraces(): Trace[] {
  const traces: Trace[] = [];
  let n = 0;
  SIDES.forEach(({ out, along }, side) => {
    PINS.forEach((o, i) => {
      // skip one pin per side, a different one each side
      if (i === [1, 4, 2, 3][side]) return;
      const at = (d: number, t: number): [number, number] => [
        +(out[0] * d + along[0] * t).toFixed(2),
        +(out[1] * d + along[1] * t).toFixed(2),
      ];
      const bendAt = PIN_TIP + 5;
      const spread = o * 0.8; // outer pins spread further
      const diag = Math.abs(spread);
      const length = LENGTHS[(side * 6 + i) % LENGTHS.length];
      const end = bendAt + diag + length;
      traces.push({
        points: [at(PIN_TIP, o), at(bendAt, o), at(bendAt + diag, o + spread), at(end, o + spread)],
        end: ENDS[n % ENDS.length],
      });
      n++;
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
