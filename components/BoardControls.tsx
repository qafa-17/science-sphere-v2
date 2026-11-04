"use client";

import { useEffect, useState } from "react";
import styles from "@/app/board/board.module.css";

const typeOptions = [
  { id: "w", label: "Wide Light (current)" },
  { id: "a", label: "Wide Heavy" },
  { id: "c", label: "Regular Caps" },
  { id: "n", label: "Condensed Caps" },
  { id: "g", label: "Grotesk Caps" },
];

/** Switch the whole site's type between the options, live, to compare them. */
export default function BoardControls() {
  const [type, setType] = useState("w");

  useEffect(() => {
    if (type === "w") delete document.documentElement.dataset.type;
    else document.documentElement.dataset.type = type;
  }, [type]);

  useEffect(
    () => () => {
      delete document.documentElement.dataset.type;
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
    </div>
  );
}
