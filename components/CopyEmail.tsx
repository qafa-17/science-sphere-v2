"use client";

import { useState } from "react";
import styles from "@/app/contact/contact.module.css";

/** A small "copy" button next to the email, for people without a mail app set up. */
export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
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
  );
}
