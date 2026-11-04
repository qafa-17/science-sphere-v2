// The CPU cursor's drawing, in its own units. The chip sits at (0, 0).
// Change the traces here to change where the circuit lines run.

/** Half the width of the chip body. */
export const BODY = 12;
/** Where the pins stop sticking out. */
export const PIN_TIP = 15;
/** Pin positions along each side. */
export const PINS = [-10, -6, -2, 2, 6, 10];

export type Pad = "dot" | "ring" | "chip";
/** Each trace: the points it runs through (starting at a pin tip), and what it ends in. */
export const TRACES: { points: [number, number][]; end: Pad }[] = [
  // top
  { points: [[-10, -15], [-10, -24], [-16, -30], [-16, -40]], end: "chip" },
  { points: [[-2, -15], [-2, -46]], end: "ring" },
  { points: [[2, -15], [2, -26], [8, -32], [8, -50]], end: "dot" },
  { points: [[10, -15], [10, -22], [16, -28], [16, -38]], end: "dot" },
  // right
  { points: [[15, -6], [28, -6], [34, -12], [46, -12]], end: "dot" },
  { points: [[15, 2], [52, 2]], end: "ring" },
  { points: [[15, 10], [26, 10], [32, 16], [40, 16]], end: "chip" },
  // bottom
  { points: [[-6, 15], [-6, 28], [-12, 34], [-12, 48]], end: "dot" },
  { points: [[2, 15], [2, 44]], end: "ring" },
  { points: [[10, 15], [10, 24], [16, 30], [16, 40]], end: "dot" },
  // left
  { points: [[-15, -10], [-26, -10], [-32, -16], [-44, -16]], end: "dot" },
  { points: [[-15, -2], [-50, -2]], end: "ring" },
  { points: [[-15, 6], [-28, 6], [-34, 12], [-40, 12]], end: "chip" },
];

/** On-screen size of the whole drawing (the chip itself is about a fifth of this). */
export const CURSOR_PX = 112;
/** The drawing's size in its own units. */
export const VIEW = 112;

/** Things that count as clickable, so the circuit forms over them. */
export const CLICKABLE =
  'a, button, [role="button"], label, select, summary, input[type="checkbox"], input[type="radio"], input[type="submit"], [data-clickable]';
