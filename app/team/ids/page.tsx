import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import Link from "next/link";
import IdCard from "@/components/IdCard";
import { team } from "@/lib/team";
import styles from "./ids.module.css";

export const metadata: Metadata = pageMeta({
  title: "ID Cards · Meet the Team",
  description: "Flip through the Science Sphere editors' ID cards: who they are, what they study and what they look after.",
  path: "/team/ids",
});

export default function IdsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/team" className={styles.back}>
          ← the team
        </Link>
        <p className="label">personnel files {"//"} hover a card to turn it over</p>
      </div>
      <div className={styles.cards}>
        {team.map((m) => (
          <IdCard key={m.id} m={m} />
        ))}
      </div>
    </main>
  );
}
