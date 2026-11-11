import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import TeamReveal from "@/components/TeamReveal";
import { team } from "@/lib/team";
import styles from "./team.module.css";

export const metadata: Metadata = pageMeta({
  title: "Meet the Team",
  description: "The students who make Science Sphere, MRU's student science magazine.",
  path: "/team",
});

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
