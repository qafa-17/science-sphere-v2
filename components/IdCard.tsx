"use client";

import { useState } from "react";
import type { Member } from "@/lib/team";
import styles from "./IdCard.module.css";

/** A barcode built from the ID number, so every card's is different but stays the same. */
function Barcode({ seed }: { seed: string }) {
  const bars: number[] = [];
  for (let i = 0; i < 34; i++) bars.push(1 + ((seed.charCodeAt(i % seed.length) * (i + 3)) % 4));
  return (
    <span className={styles.barcode} aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} style={{ height: w, opacity: i % 2 ? 0 : 1 }} />
      ))}
    </span>
  );
}

/**
 * A staff ID badge on a lanyard. Hover (or tap) flips it over to show the bio
 * and an interesting fact on the back.
 */
export default function IdCard({ m }: { m: Member }) {
  const [flipped, setFlipped] = useState(false);
  const roles = m.role.replace(/\.$/, "").toUpperCase();

  return (
    <article id={m.id} className={styles.badge} aria-label={`${m.name}, ID card`}>
      <span className={styles.lanyard} aria-hidden="true">
        <span>SCI_SPHERE · SCI_SPHERE · SCI_SPHERE · SCI_SPHERE · SCI_SPHERE ·</span>
      </span>
      <span className={styles.clip} aria-hidden="true" />
      <button
        type="button"
        className={`${styles.card} ${flipped ? styles.flipped : ""}`}
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? `Show the front of ${m.name}'s card` : `Turn ${m.name}'s card over`}
      >
        {/* front */}
        <span className={styles.front}>
          <span className={styles.slot} aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-bw-160.png" alt="" className={styles.logo} />
          <span className={styles.field}>SUBJECT :</span>
          <span className={styles.name}>{m.name}</span>
          <span className={styles.degree}>{m.degree}</span>
          <span className={styles.middle}>
            <span className={styles.photo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.photo} alt="" />
            </span>
            <Barcode seed={m.idNumber + m.serial} />
          </span>
          <span className={styles.idLine}>
            <span>ID : {m.idNumber}</span>
            <span>{roles}</span>
          </span>
          <span className={styles.expertise}>
            {m.expertise.map((e) => (
              <span key={e}>{e}</span>
            ))}
          </span>
        </span>

        {/* back */}
        <span className={styles.back}>
          <span className={styles.stripe} aria-hidden="true" />
          <span className={styles.backBody}>
            <span className={styles.field}>BIO :</span>
            <span className={styles.bio}>{m.bio}</span>
            <span className={styles.field}>INTERESTING FACT :</span>
            <span className={styles.bio}>{m.fact}</span>
          </span>
          <span className={styles.serial}>{m.serial}</span>
        </span>
      </button>
    </article>
  );
}
