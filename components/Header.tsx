"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TIME_ZONE, officeStatus } from "@/lib/officeHours";
import { themeFor } from "@/lib/themes";
import type { CSSProperties } from "react";
import Heart from "./Heart";
import styles from "./Header.module.css";

const links = [
  { href: "/issues", label: "Issues" },
  { href: "/pitch", label: "Pitch" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
];

/** Calgary time, ticking every second, plus whether the office is open. */
function useReadout() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock only exists in the browser
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const time = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return { time, open: officeStatus(now).open };
}

export default function Header() {
  const pathname = usePathname();
  const readout = useReadout();
  const [menuOpen, setMenuOpen] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const theme = themeFor(pathname);
  const colours = { "--hdr-bg": theme.bg, "--hdr-fg": theme.fg, "--hdr-accent": theme.accent } as CSSProperties;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu after navigating
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className={styles.bar} style={colours}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Science Sphere home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-bw-160.png" alt="" width={34} height={34} />
          <span>SCIENCE_SPHERE</span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {links.map((l, i) => (
            <span key={l.href} className={styles.item}>
              {i > 0 && <span className={styles.sep} aria-hidden="true">{"//"}</span>}
              <Link href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className={styles.readout} aria-live="off">
          {readout && (
            <>
              <span>CGY {readout.time}</span>
              <Link href="/contact" className={styles.status}>
                <Heart size={17} beating={readout.open} />
                {readout.open ? "Office open" : "Office closed"}
              </Link>
            </>
          )}
        </div>

                <a
          href="https://www.mtroyal.ca"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.partner}
          aria-label="Mount Royal University (opens in a new tab)"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mru-logo-64.png" alt="" width={72} height={26} />
        </a>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="phone-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "Close [x]" : "Menu [+]"}
        </button>
      </div>

      <nav id="phone-menu" className={`${styles.phoneMenu} ${menuOpen ? styles.open : ""}`} aria-label="Main">
        {[{ href: "/", label: "Home" }, ...links].map((l, i) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
            <span className={styles.index}>0{i}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
