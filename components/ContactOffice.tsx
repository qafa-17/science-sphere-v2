"use client";

import { useEffect, useState } from "react";
import Heart from "@/components/Heart";
import { OFFICE_ROOM, TIME_ZONE, dayHours, formatTime, nowInCalgary, officeStatus } from "@/lib/officeHours";
import styles from "@/app/contact/contact.module.css";

const FIRST = 9 * 60; // the timetable runs 9am
const LAST = 17 * 60; // to 5pm
const hours = Array.from({ length: (LAST - FIRST) / 60 + 1 }, (_, i) => FIRST + i * 60);
const pct = (m: number) => `${((m - FIRST) / (LAST - FIRST)) * 100}%`;

/** The ticking Calgary clock; null until the page is in the browser. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock only exists in the browser
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * The office block: the heart (beating while someone's in), a terminal-style
 * readout of the room and its status, and the week's timetable with today
 * marked and a line at the current time.
 */
export default function ContactOffice() {
  const now = useNow();
  const status = now ? officeStatus(now) : null;
  const cal = now ? nowInCalgary(now) : null;
  const time = now
    ? new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now)
    : "--:--:--";

  const rows: [string, string][] = [
    ["ROOM", OFFICE_ROOM],
    ["LOCAL TIME", `${time} CGY`],
    ["STATUS", status ? (status.open ? "OPEN" : "CLOSED") : "..."],
    ["NOTE", status ? status.text.replace(/^(Open now|Closed now)[.,]?\s*/, "") || "None" : "..."],
  ];

  return (
    <div className={styles.office}>
      <figure className={styles.heartBox}>
        <Heart size={190} beating={!!status?.open} />
        <figcaption className={styles.tag}>
          <span>SPECIMEN 01 {"//"} OFFICE HEART</span>
          <span>{status?.open ? "BEATING: SOMEONE'S IN" : "RESTING: NO ONE'S IN"}</span>
        </figcaption>
      </figure>

      <div className={styles.readout} aria-live="off">
        {rows.map(([k, v]) => (
          <p key={k} className={styles.readLine}>
            <span className={styles.prompt}>&gt;</span>
            <span className={styles.readKey}>{k}</span>
            <span className={styles.dots} aria-hidden="true" />
            <span className={k === "STATUS" && status?.open ? styles.readOpen : undefined}>{v}</span>
          </p>
        ))}
        <p className={styles.readLine}>
          <span className={styles.prompt}>&gt;</span>
          <span className={styles.cursorBlink} aria-hidden="true" />
        </p>
      </div>

      <div className={styles.week} role="table" aria-label="Office hours this week">
        <div className={styles.times} aria-hidden="true">
          {hours.map((h) => (
            <span key={h} style={{ top: pct(h) }}>
              {formatTime(h).replace(":00", "")}
            </span>
          ))}
        </div>
        {dayHours.map((d) => {
          const today = cal?.day === d.day;
          return (
            <div key={d.day} role="row" className={`${styles.dayCol} ${today ? styles.today : ""}`}>
              <span role="columnheader" className={styles.dayName}>
                {d.name.slice(0, 3)}
                {today && <span className={styles.todayMark}> {"//"} today</span>}
              </span>
              <div className={styles.dayTrack}>
                {hours.slice(1, -1).map((h) => (
                  <span key={h} className={styles.hourLine} style={{ top: pct(h) }} />
                ))}
                <span
                  role="cell"
                  className={styles.slot}
                  style={{ top: pct(d.start), height: `calc(${pct(d.end)} - ${pct(d.start)})` }}
                >
                  {formatTime(d.start)}
                  <br />
                  {formatTime(d.end)}
                </span>
                {today && cal && cal.minutes > FIRST && cal.minutes < LAST && (
                  <span className={styles.nowLine} style={{ top: pct(cal.minutes) }} aria-hidden="true" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
