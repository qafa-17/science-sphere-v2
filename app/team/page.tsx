import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { team } from "@/lib/team";
import styles from "./team.module.css";

export const metadata: Metadata = {
  title: "Meet the Team · Science Sphere",
  description: "The students who make Science Sphere, MRU's student science magazine.",
};

// Where things sit on the poster, in percent of its width (x) and height (y).
// Faces alternate left and right; each name sits in the middle column at the height of its face.
const SPOTS = [
  { faceTop: 7, labelY: 28 },
  { faceTop: 24, labelY: 43 },
  { faceTop: 45, labelY: 58 },
  { faceTop: 61, labelY: 73 },
];
const FACE_H = 29; // % of the poster's height
const PANEL = { left: 25, right: 75 };

export default function TeamPage() {
  // the red line runs through each person's dot in turn
  const dots = team.map((m, i) => ({
    x: m.side === "left" ? PANEL.left + 2 : PANEL.right - 2,
    y: SPOTS[i].labelY - 3,
  }));

  return (
    <main className={styles.page}>
      <div className={styles.poster}>
        {team.map((m, i) => (
          <Link
            key={m.id}
            href={`/team/ids#${m.id}`}
            className={`${styles.face} ${m.side === "right" ? styles.faceRight : ""}`}
            style={
              {
                top: `${SPOTS[i].faceTop}%`,
                height: `${FACE_H}%`,
                "--aspect": m.faceAspect,
              } as CSSProperties
            }
            aria-label={`${m.name}'s ID card`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.photo} alt="" />
          </Link>
        ))}

        <div className={styles.panel}>
          <header className={styles.head}>
            <span className={styles.corner}>a.y.</span>
            <span className={`${styles.corner} ${styles.cornerRight}`}>&apos;26–&apos;27</span>
            <p className={styles.meet}>meet the</p>
            <h1 className={styles.title}>Team</h1>
          </header>
        </div>

        <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={dots.map((d) => `${d.x},${d.y}`).join(" ")} />
        </svg>
        {dots.map((d, i) => (
          <span key={i} className={styles.dot} style={{ left: `${d.x}%`, top: `${d.y}%` }} aria-hidden="true" />
        ))}

        {team.map((m, i) => (
          <section
            key={m.id}
            className={`${styles.label} ${m.side === "right" ? styles.labelRight : ""}`}
            style={{ top: `${SPOTS[i].labelY}%` }}
            aria-label={m.name}
          >
            <h2 className={styles.name}>{m.name}</h2>
            <p className={styles.role}>{m.role}</p>
            <p className={styles.expertise}>
              {m.expertise.join(" | ")}
              {m.expertise[m.expertise.length - 1].endsWith(".") ? "" : "."}
            </p>
            <Link href={`/team/ids#${m.id}`} className={styles.more}>
              learn more →
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
