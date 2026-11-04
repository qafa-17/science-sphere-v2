"use client";

import { useEffect, useState } from "react";
import styles from "@/app/board/board.module.css";

const typeOptions = [
  { id: "a", label: "A · Archive" },
  { id: "b", label: "B · Signal" },
];
const pixelOptions = [
  { id: "silkscreen", label: "Silkscreen" },
  { id: "doto", label: "Doto" },
  { id: "pixelify", label: "Pixelify" },
];

/** Switch the whole site's type between the options, live, to compare them. */
export default function BoardControls() {
  const [type, setType] = useState("a");
  const [pixel, setPixel] = useState("silkscreen");

  useEffect(() => {
    document.documentElement.dataset.type = type;
    document.documentElement.dataset.pixel = pixel;
  }, [type, pixel]);

  useEffect(
    () => () => {
      delete document.documentElement.dataset.type;
      delete document.documentElement.dataset.pixel;
    },
    [],
  );

  return (
    <div className={styles.controls} role="group" aria-label="Try the type options">
      <span className="label">Type</span>
      {typeOptions.map((o) => (
        <button key={o.id} type="button" aria-pressed={type === o.id} onClick={() => setType(o.id)}>
          {o.label}
        </button>
      ))}
      <span className={`label ${styles.controlsGap}`}>Pixel</span>
      {pixelOptions.map((o) => (
        <button key={o.id} type="button" aria-pressed={pixel === o.id} onClick={() => setPixel(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
