import Link from "next/link";
import type { ReactNode } from "react";
import BootLine from "./BootLine";
import styles from "./Lab.module.css";

const prototypes = [
  { id: "sphere", n: "01", name: "Sphere" },
  { id: "sky", n: "02", name: "Pixel sky" },
  { id: "circuit", n: "03", name: "Circuit" },
];

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

      <nav className={styles.switcher} aria-label="Prototypes">
        {prototypes.map((p) => (
          <Link key={p.id} href={`/lab/${p.id}`} aria-current={p.id === current ? "page" : undefined}>
            {p.n} {p.name}
          </Link>
        ))}
        <span className={styles.hint}>{hint}</span>
      </nav>
    </main>
  );
}
