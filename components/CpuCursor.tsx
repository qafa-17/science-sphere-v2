"use client";

import { useEffect, useRef, useState } from "react";
import { CLICKABLE, CURSOR_PX } from "@/lib/cpu";
import CpuDrawing from "./CpuDrawing";
import styles from "./CpuCursor.module.css";

/**
 * The CPU cursor. Over anything clickable, circuit lines grow out of the chip
 * all at once and finish forming in about 0.3 seconds.
 * Only for mice and trackpads; touch screens keep their normal behaviour.
 */
export default function CpuCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- only known in the browser
    setEnabled(true);
    document.documentElement.classList.add("cpu-cursor");

    const half = CURSOR_PX / 2;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${e.clientX - half}px, ${e.clientY - half}px, 0)`;
      if (el) el.dataset.shown = "true";
      const target = e.target as Element | null;
      setActive(!!target?.closest?.(CLICKABLE));
    };
    const leave = () => {
      if (ref.current) delete ref.current.dataset.shown;
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("cpu-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      className={`${styles.cursor} ${active ? styles.active : ""} ${pressed ? styles.pressed : ""}`}
      style={{ width: CURSOR_PX, height: CURSOR_PX }}
      aria-hidden="true"
    >
      <CpuDrawing size={CURSOR_PX} />
    </div>
  );
}
