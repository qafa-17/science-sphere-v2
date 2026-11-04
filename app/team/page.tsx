import type { Metadata } from "next";
import Link from "next/link";
import { team } from "@/lib/team";
import styles from "./team.module.css";

export const metadata: Metadata = {
  title: "Meet the Team · Science Sphere",
  description: "The students who make Science Sphere, MRU's student science magazine.",
};

export default function TeamPage() {
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className="label">sci_sphere {"//"} 2026–27</p>
        <h1 className={styles.title}>
          <span className={styles.small}>meet the</span>
          Team
        </h1>
        <p className={styles.blurb}>
          Science Sphere is a magazine made by students, <em>for</em> students. This year&apos;s team is made up of a variety
          of experience and subject expertise.
        </p>
      </header>

      <div className={styles.people}>
        {team.map((m) => (
          <section key={m.id} className={`${styles.person} ${m.side === "right" ? styles.right : ""}`} aria-label={m.name}>
            <Link href={`/team/ids#${m.id}`} className={styles.face} aria-label={`${m.name}'s ID card`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.photo} alt="" />
              <span className={styles.dot} aria-hidden="true" />
            </Link>
            <svg className={styles.line} viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points="0,62 150,18 200,18" />
            </svg>
            <div className={styles.label}>
              <h2 className={styles.name}>{m.name}</h2>
              <p className={styles.role}>{m.role}</p>
              <p className={styles.expertise}>{m.expertise.join(" | ")}</p>
              <Link href={`/team/ids#${m.id}`} className={styles.more}>
                learn more →
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
