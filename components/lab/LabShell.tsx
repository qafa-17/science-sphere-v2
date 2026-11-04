import Link from "next/link";
import type { ReactNode } from "react";
import BootLine from "./BootLine";
import styles from "./Lab.module.css";

export const prototypes = [
  { id: "sphere", n: "01", name: "Sphere" },
  { id: "sky", n: "02", name: "Pixel sky" },
  { id: "circuit", n: "03", name: "Circuit" },
  { id: "dive", n: "04", name: "The dive" },
  { id: "morph", n: "05", name: "Morphing" },
  { id: "ascent", n: "06", name: "The ascent" },
];

/** The row of buttons for switching between prototypes. */
export function Switcher({ current, hint, className = "" }: { current: string; hint: string; className?: string }) {
  return (
    <nav className={`${styles.switcher} ${className}`} aria-label="Prototypes">
      {prototypes.map((p) => (
        <Link key={p.id} href={`/lab/${p.id}`} aria-current={p.id === current ? "page" : undefined}>
          {p.n} {p.name}
        </Link>
      ))}
      <span className={styles.hint}>{hint}</span>
    </nav>
  );
}

/** The frame around each landing-page prototype: the title, a boot line, and a switcher. */
export default function LabShell({
  current,
  hint,
  children,
  titlePosition = "center",
  pixelTitle = false,
}: {
  current: string;
  hint: string;
  children: ReactNode;
  titlePosition?: "center" | "bottom";
  pixelTitle?: boolean;
}) {
  const me = prototypes.find((p) => p.id === current)!;
  return (
    <main className={styles.stage}>
      {children}

      <div
        className={`${styles.overlay} ${titlePosition === "bottom" ? styles.bottom : ""} ${pixelTitle ? styles.pixelTitle : ""}`}
      >
        <BootLine text={`> sci_sphere.sys // prototype_${me.n}`} />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            Science
            <br />
            Sphere
          </h1>
          <p className="label">the mru science experience</p>
        </div>
      </div>

      <Switcher current={current} hint={hint} />
    </main>
  );
}
