import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any address that doesn't exist (and for the workshop pages on the published site).
export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className="label">&gt; sci_sphere.sys {"//"} error 404</p>
        <h1 className={styles.title}>
          Lost in
          <br />
          the ether
        </h1>
        <p className={styles.lede}>
          This page drifted out of orbit, or it never existed. Check the address, or head back to somewhere we know.
        </p>
        <pre className={styles.log} aria-hidden="true">
          {"> locating page ......... failed\n> signal ................. none\n> suggested route ........ below_"}
        </pre>
        <nav className={styles.links} aria-label="Where to go">
          <Link href="/" className={styles.primary}>
            Back home →
          </Link>
          <Link href="/issues">Read the issues</Link>
          <Link href="/pitch">Pitch a story</Link>
          <Link href="/contact">Contact us</Link>
        </nav>
      </div>
    </main>
  );
}
