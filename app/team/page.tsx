import type { Metadata } from "next";
import TeamReveal from "@/components/TeamReveal";
import { team } from "@/lib/team";
import styles from "./team.module.css";

export const metadata: Metadata = {
  title: "Meet the Team · Science Sphere",
  description: "The students who make Science Sphere, MRU's student science magazine.",
};

export default function TeamPage() {
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <span className={styles.corner}>a.y.</span>
        <span className={`${styles.corner} ${styles.cornerRight}`}>&apos;26–&apos;27</span>
        <p className={styles.meet}>meet the</p>
        <h1 className={styles.title}>Team</h1>
        <p className={`label ${styles.hint}`}>scroll ↓</p>
      </header>
      <TeamReveal team={team} />
    </main>
  );
}
