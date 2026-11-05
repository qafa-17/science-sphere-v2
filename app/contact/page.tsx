import type { Metadata } from "next";
import Link from "next/link";
import ContactChannels from "@/components/ContactChannels";
import ContactOffice, { OfficeLight } from "@/components/ContactOffice";
import { MAIN_EMAIL } from "@/lib/pitch";
import { OFFICE_ROOM } from "@/lib/officeHours";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact · Science Sphere",
  description: "Office hours, email and Instagram for Science Sphere, MRU's student science magazine.",
};

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <span className={styles.corner}>{OFFICE_ROOM}</span>
        <span className={`${styles.corner} ${styles.cornerRight}`}>MRU</span>
        <p className={styles.small}>get in</p>
        <h1 className={styles.title}>Touch</h1>
        <OfficeLight />
        <p className={`label ${styles.hint}`}>scroll ↓</p>
      </header>

      <ContactOffice />

      <section className={styles.block} aria-labelledby="channels">
        <p className={`label ${styles.blockLabel}`} id="channels">
          02 {"//"} channels
        </p>
        <ContactChannels email={MAIN_EMAIL} instagram="mrusciencesphere" />
        <p className={styles.pitchNote}>
          Have a story idea? <Link href="/pitch">Pitch it here →</Link>
        </p>
      </section>
    </main>
  );
}
