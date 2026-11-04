"use client";

import { useEffect, useRef } from "react";
import { runCanvas } from "@/lib/canvasLoop";
import { createSky } from "@/lib/scenes/sky";
import styles from "./Lab.module.css";

/** Prototype 02: a pixel-art night sky. */
export default function PixelSkyCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const sky = createSky();
    return runCanvas(ref.current!, (f) => sky.draw(f), { maxDpr: 1, onResize: sky.resize });
  }, []);
  return <canvas ref={ref} className={`${styles.canvas} ${styles.pixel}`} aria-label="A pixel-art night sky" role="img" />;
}
