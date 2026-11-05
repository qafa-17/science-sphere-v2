"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/contact/contact.module.css";

/**
 * The two contact cards slide in from opposite sides as you scroll down to
 * them, following the scroll (and sliding back out if you scroll up).
 */
export default function ContactChannels({ email, instagram }: { email: string; instagram: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // 0 when the cards' top reaches the bottom of the screen, 1 by the time it's at 55%
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.45)));
      el.style.setProperty("--in", String(1 - (1 - p) ** 3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const [user, domain] = email.split("@");

  return (
    <div ref={ref} className={styles.channels}>
      <div className={`${styles.channel} ${styles.channelEmail}`}>
        <span className="label">channel_01 {"//"} email</span>
        <a href={`mailto:${email}`} className={styles.channelLink}>
          {user}
          <wbr />@{domain}
        </a>
        <button
          type="button"
          className={styles.copy}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(email);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard blocked: the mailto link still works */
            }
          }}
        >
          {copied ? "[ copied ]" : "[ copy ]"}
        </button>
      </div>
      <div className={`${styles.channel} ${styles.channelInsta}`}>
        <span className="label">channel_02 {"//"} instagram</span>
        <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className={styles.channelLink}>
          @{instagram} <span aria-hidden="true">↗</span>
        </a>
        <span className={styles.channelNote}>DMs open</span>
      </div>
    </div>
  );
}
