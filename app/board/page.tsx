import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import BoardControls from "@/components/BoardControls";
import CpuDrawing from "@/components/CpuDrawing";
import Heart from "@/components/Heart";
import { themes } from "@/lib/themes";
import { pagePalettes, palettes, rgb, textOn } from "@/lib/palettes";
import styles from "./board.module.css";

export const metadata: Metadata = { title: "Look & Feel · Science Sphere" };

function Star({ colour }: { colour: string }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.star} aria-hidden="true">
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill={colour} />
    </svg>
  );
}

function Section({ n, title, note, children }: { n: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`s${n}`}>
      <header className={styles.sectionHead}>
        <span className="label">{n} {"//"}</span>
        <h2 id={`s${n}`}>{title}</h2>
        {note && <p className={styles.note}>{note}</p>}
      </header>
      {children}
    </section>
  );
}

function Barcode() {
  // a fixed pattern, so it looks the same every time
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1];
  return (
    <span className={styles.barcode} aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} style={{ width: w * 2, opacity: i % 2 ? 0 : 1 }} />
      ))}
    </span>
  );
}

export default function BoardPage() {
  const used = (id: string) => pagePalettes.filter((p) => p.palette === id);

  return (
    <main className={styles.board}>
      <div className="wrap">
        <div className={styles.hero}>
          <p className="label">file_00 // look &amp; feel // draft 2</p>
          <h1 className={styles.title}>Look &amp; Feel Board</h1>
          <p className={styles.lede}>
            Everything the new site gets built from, on one page. Nothing here is final: tell me what to keep, swap or
            change, and it changes everywhere.
          </p>
        </div>
      </div>

      <BoardControls />

      <div className="wrap">
        {/* ---------- 01 palettes ---------- */}
        <Section n="01" title="Palettes" note="One palette per page. The header and the CPU cursor stay the same everywhere.">
          <div className={styles.palettes}>
            {Object.values(palettes).map((p) => (
              <div key={p.id} className={styles.palette}>
                <div className={styles.paletteHead}>
                  <h3>{p.name}</h3>
                  <p className="label">
                    used on: {used(p.id).map((u) => u.page).join(" + ") || "nothing yet"}
                  </p>
                </div>
                <ul className={styles.swatches}>
                  {p.swatches.map((s, i) => {
                    const fg = textOn(s.hex);
                    const next = p.swatches[(i + 2) % p.swatches.length].hex;
                    return (
                      <li key={s.hex} style={{ "--bg": s.hex, "--fg": fg } as CSSProperties}>
                        <span className={styles.chipSquare}>
                          <Star colour={textOn(s.hex) === "#FFFFFF" ? next : fg} />
                        </span>
                        <span className={styles.chipWide}>
                          <strong>{s.name}</strong>
                          <span className={styles.codes}>
                            HEX {s.hex.slice(1)}
                            <br />
                            RGB {rgb(s.hex)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <ul className={styles.mapping}>
            {pagePalettes.map((p) => (
              <li key={p.path}>
                <span className="label">{p.path}</span>
                <strong>{p.page}</strong>
                <span>→ {palettes[p.palette].name}</span>
                <span className={styles.why}>{p.why}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ---------- 02 type ---------- */}
        <Section
          n="02"
          title="Type"
          note="B is in use for now. A felt loud, so C, D and E are calmer options to compare: use the bar above and the whole page (and the header) changes live."
        >
          <div className={styles.specimen}>
            <div className={styles.specRow}>
              <p className="label">
                display // <span className={`${styles.fontName} ${styles.fb}`}>Space Grotesk 700</span><span className={`${styles.fontName} ${styles.fa}`}>Archivo Expanded 800</span><span className={`${styles.fontName} ${styles.fc}`}>Archivo 600</span><span className={`${styles.fontName} ${styles.fd}`}>Instrument Serif</span><span className={`${styles.fontName} ${styles.fe}`}>Bricolage Grotesque 700</span>
              </p>
              <p className={styles.specHero}>Science, by students.</p>
            </div>
            <div className={styles.specRow}>
              <p className="label">page title</p>
              <h3 className={styles.specH1}>Meet the Team</h3>
            </div>
            <div className={styles.specRow}>
              <p className="label">section</p>
              <h3 className={styles.specH2}>This month&apos;s pitch meeting</h3>
            </div>
            <div className={styles.specRow}>
              <p className="label">
                body // <span className={`${styles.fontName} ${styles.fb}`}>Space Grotesk</span><span className={`${styles.fontName} ${styles.fa}`}>Archivo</span><span className={`${styles.fontName} ${styles.fc}`}>Archivo</span><span className={`${styles.fontName} ${styles.fd}`}>Archivo</span><span className={`${styles.fontName} ${styles.fe}`}>Bricolage Grotesque</span>
              </p>
              <p className={styles.specBody}>
                Science Sphere is a magazine made by students, <em>for</em> students. This year&apos;s team is made up
                of a variety of experience and subject expertise.
              </p>
            </div>
            <div className={styles.specRow}>
              <p className="label">
                labels // <span className={`${styles.fontName} ${styles.fb}`}>JetBrains Mono</span><span className={`${styles.fontName} ${styles.fa}`}>Space Mono</span><span className={`${styles.fontName} ${styles.fc}`}>Space Mono</span><span className={`${styles.fontName} ${styles.fd}`}>JetBrains Mono</span><span className={`${styles.fontName} ${styles.fe}`}>Space Mono</span>
              </p>
              <p className={styles.specMono}>
                SUBJECT: QANITA FARRUKH &nbsp;&nbsp; ID: 482913 &nbsp;&nbsp; EDITOR. WRITER. DESIGNER.
              </p>
            </div>
            <div className={styles.specRow}>
              <p className="label">pixel accent // Pixelify Sans (chosen)</p>
              <p className={styles.specPixel}>ISSUE_003 // FALL2026</p>
            </div>
          </div>
        </Section>

        {/* ---------- 03 buttons ---------- */}
        <Section n="03" title="Buttons & links" note="Deep space blue, as you picked. On other pages they take that page's colours the same way. Hover them to see the cursor's circuit form.">
          <div className={styles.buttonPanels}>
            {[{ id: "dark", label: "on deep space blue" }].map((panel) => (
              <div key={panel.id} className={`${styles.buttonPanel} ${panel.id === "dark" ? styles.dark : ""}`}>
                <p className="label">{panel.label}</p>
                <div className={styles.buttonRow}>
                  <a href="#s03" className={styles.btnPrimary}>
                    Read issue_003 <span aria-hidden="true">→</span>
                  </a>
                  <a href="#s03" className={styles.btnSecondary}>
                    Pitch a story
                  </a>
                </div>
                <div className={styles.buttonRow}>
                  <a href="#s03" className={styles.tag}>[ physics ]</a>
                  <a href="#s03" className={styles.tag}>[ biology ]</a>
                  <a href="#s03" className={styles.tag}>[ computing ]</a>
                </div>
                <div className={styles.buttonRow}>
                  <a href="https://instagram.com/mrusciencesphere" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                    @mrusciencesphere <span aria-hidden="true">↗</span>
                  </a>
                  <a href="mailto:sciencesphere@mtroyal.ca" className={styles.textLink}>
                    sciencesphere@mtroyal.ca
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- 04 cursor ---------- */}
        <Section
          n="04"
          title="CPU cursor"
          note="Now 0.8 of its old size, and every one of the 24 pins grows a trace (plus a few side branches). Over anything clickable they all leave the chip at once and finish forming in 0.3 seconds, then the pads pop in. Dark on light pages, light on dark ones. Phones and tablets don't get it."
        >
          <div className={styles.cursorDemo}>
            <figure>
              <div className={styles.cursorStage}>
                <CpuDrawing size={260} />
              </div>
              <figcaption className="label">idle // just the chip</figcaption>
            </figure>
            <figure>
              <div className={`${styles.cursorStage} cpu-on`}>
                <CpuDrawing size={260} />
              </div>
              <figcaption className="label">over a link // circuit formed</figcaption>
            </figure>
            <figure>
              <div className={`${styles.cursorStage} ${styles.dark} cpu-on`}>
                <CpuDrawing size={260} />
              </div>
              <figcaption className="label">on a dark page</figcaption>
            </figure>
          </div>
        </Section>

        {/* ---------- 05 header ---------- */}
        <Section
          n="05"
          title="Header"
          note="To stop the jump from black and white into colourful pages, the header now takes on each page's colours. Black stays only for pages outside the main five, like this board."
        >
          <div className={styles.previews}>
            {[
              { page: "Landing", theme: themes.space, on: "" },
              { page: "Issues", theme: themes.carousel, on: "Issues" },
              { page: "Pitch", theme: themes.melon, on: "Pitch" },
              { page: "Team, Contact", theme: themes.sunset, on: "Team" },
              { page: "Other", theme: themes.ink, on: "" },
            ].map(({ page, theme, on }) => (
              <div key={page} className={styles.preview}>
                <span className="label">{page}</span>
                <div
                  className={styles.previewBar}
                  style={{ background: theme.bg, color: theme.fg, "--accent": theme.accent } as CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/logo-bw-160.png" alt="" />
                  <strong>SCIENCE_SPHERE</strong>
                  <span className={styles.previewNav}>
                    {["Issues", "Pitch", "Team", "Contact"].map((l) => (
                      <span key={l} className={l === on ? styles.on : undefined}>
                        {l}
                      </span>
                    ))}
                  </span>
                  <span className={styles.previewStatus}>
                    <Heart size={14} beating /> office open
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ul className={styles.facts}>
            <li>
              <span className="label">left</span>The black and white logo and SCIENCE_SPHERE
            </li>
            <li>
              <span className="label">middle</span>The pages, split with // and the current one in [ brackets ] in
              the page&apos;s accent colour
            </li>
            <li>
              <span className="label">right</span>A live Calgary clock, and a real heart that beats while the office
              is open and goes still and grey when it&apos;s closed (it links to Contact)
            </li>
            <li>
              <span className="label">phone</span>The links fold into a &quot;Menu [+]&quot; that opens a numbered list
            </li>
          </ul>
        </Section>

        {/* ---------- 06 logo ---------- */}
        <Section n="06" title="Logo" note="Cut out from your file. The black and white one goes on the header and the ID cards.">
          <div className={styles.logos}>
            {[
              { src: "/brand/logo.webp", label: "colour", bg: "var(--paper)" },
              { src: "/brand/logo-bw.webp", label: "black & white", bg: "var(--paper)" },
              { src: "/brand/logo-bw-light.webp", label: "white & black", bg: "var(--ink)" },
            ].map((l) => (
              <figure key={l.src} style={{ background: l.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.src} alt={`Science Sphere logo, ${l.label}`} />
                <figcaption className="label" style={{ color: l.bg === "var(--ink)" ? "var(--paper)" : undefined }}>
                  {l.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        {/* ---------- 07 details ---------- */}
        <Section n="07" title="Details" note="Small pieces that repeat across pages.">
          <div className={styles.details}>
            <figure className={styles.detail}>
              <div className={styles.folders}>
                {[
                  { n: "001", season: "FALL2025", colour: "#2E5574" },
                  { n: "002", season: "WINTER2026", colour: "#4C473E" },
                  { n: "003", season: "FALL2026", colour: "#3E4D0E" },
                ].map((f) => (
                  <div key={f.n} className={styles.folder} style={{ "--tab": f.colour } as CSSProperties}>
                    <span className={styles.tab}>
                      issue_{f.n} {"//"}
                      <br />
                      {f.season}
                    </span>
                  </div>
                ))}
              </div>
              <figcaption className="label">issue folder tabs, in darker versions of each cover&apos;s colour</figcaption>
            </figure>

            <figure className={styles.detail}>
              <div className={styles.idStrip}>
                <span className={styles.idLabel}>ID:</span> 482913
                <Barcode />
              </div>
              <figcaption className="label">ID-card numbers and barcode</figcaption>
            </figure>

            <figure className={styles.detail}>
              <div className={styles.statusRow}>
                <Heart size={64} beating />
                <Heart size={64} />
                <span>
                  <strong>Open now</strong> (beating)
                  <br />
                  <span className="label">closed: still and grey</span>
                </span>
              </div>
              <figcaption className="label">office status heart</figcaption>
            </figure>

            <figure className={styles.detail}>
              <div className={styles.starRow}>
                <Star colour="var(--space-gold)" />
                <Star colour="#E6A341" />
                <Star colour="var(--sunset-tomato)" />
                <Star colour="var(--melon-zest)" />
              </div>
              <figcaption className="label">four-point star (from your palettes and the wizard&apos;s robe)</figcaption>
            </figure>
          </div>
        </Section>
      </div>
    </main>
  );
}
