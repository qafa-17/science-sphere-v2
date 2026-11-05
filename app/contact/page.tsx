import type { Metadata } from "next";
import Link from "next/link";
import ContactOffice from "@/components/ContactOffice";
import CopyEmail from "@/components/CopyEmail";
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
      </header>

      <section className={styles.block} aria-labelledby="office">
        <p className={`label ${styles.blockLabel}`} id="office">
          01 {"//"} the office
        </p>
        <ContactOffice />
      </section>

      <section className={styles.block} aria-labelledby="channels">
        <p className={`label ${styles.blockLabel}`} id="channels">
          02 {"//"} channels
        </p>
        <div className={styles.channels}>
          <div className={styles.channel}>
            <span className="label">email</span>
            <a href={`mailto:${MAIN_EMAIL}`} className={styles.channelLink}>
              {MAIN_EMAIL.split("@")[0]}
              <wbr />@{MAIN_EMAIL.split("@")[1]}
            </a>
            <CopyEmail email={MAIN_EMAIL} />
          </div>
          <div className={styles.channel}>
            <span className="label">instagram</span>
            <a
              href="https://instagram.com/mrusciencesphere"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.channelLink}
            >
              @mrusciencesphere <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <p className={styles.pitchNote}>
          Have a story idea? <Link href="/pitch">Pitch it here →</Link>
        </p>
      </section>
    </main>
  );
}
