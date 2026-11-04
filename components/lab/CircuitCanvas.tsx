"use client";

import { useEffect, useRef } from "react";
import { runCanvas } from "@/lib/canvasLoop";
import { createCircuit } from "@/lib/scenes/circuit";
import styles from "./Lab.module.css";

/** Prototype 03: a circuit board around a big version of the CPU cursor. */
export default function CircuitCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const circuit = createCircuit();
    return runCanvas(ref.current!, (f) => circuit.draw(f), { onResize: circuit.resize });
  }, []);
  return <canvas ref={ref} className={styles.canvas} aria-label="A circuit board with signals running along it" role="img" />;
}
