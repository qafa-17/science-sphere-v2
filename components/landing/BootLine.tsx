"use client";

import { useEffect, useState } from "react";
import styles from "./Landing.module.css";

/** One terminal line that types itself out once, then leaves a blinking caret. */
export default function BootLine({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show it all at once
      setShown(text.length);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(t);
    }, 38);
    return () => clearInterval(t);
  }, [text]);
  return (
    <p className={styles.boot} aria-hidden="true">
      {text.slice(0, shown)}
      <span className={styles.caret}>_</span>
    </p>
  );
}
