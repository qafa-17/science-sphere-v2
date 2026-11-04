"use client";

import { useEffect, useRef } from "react";
import { runCanvas } from "@/lib/canvasLoop";
import { createSphere } from "@/lib/scenes/sphere";
import styles from "./Lab.module.css";

/** Prototype 01: the logo's network sphere in 3D. */
export default function SphereCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const sphere = createSphere();
    return runCanvas(ref.current!, (f) => sphere.draw(f));
  }, []);
  return <canvas ref={ref} className={styles.canvas} aria-label="A turning sphere of connected dots" role="img" />;
}
