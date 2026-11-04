"use client";

import { useEffect, useState } from "react";
import styles from "@/app/board/board.module.css";

const typeOptions = [
  { id: "b", label: "B · Signal (current)" },
  { id: "a", label: "A · Archive" },
  { id: "c", label: "C · Quiet Archive" },
  { id: "d", label: "D · Editorial" },
  { id: "e", label: "E · Bricolage" },
];

/** Switch the whole site's type between the options, live, to compare them. */
export default function BoardControls() {
  const [type, setType] = useState("b");

  useEffect(() => {
    if (type === "b") delete document.documentElement.dataset.type;
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
