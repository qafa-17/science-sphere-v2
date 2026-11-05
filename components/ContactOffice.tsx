"use client";

import { useEffect, useRef, useState } from "react";
import Heart from "@/components/Heart";
import {
  OFFICE_ROOM,
  TIME_ZONE,
  dayHours,
  formatTime,
  nowInCalgary,
  officeStatus,
} from "@/lib/officeHours";
import styles from "@/app/contact/contact.module.css";

type Slot = (typeof dayHours)[number];

const FIRST = 9 * 60; // the timetable runs 9am
const LAST = 17 * 60; // to 5pm
const hours = Array.from(
  { length: (LAST - FIRST) / 60 + 1 },
  (_, i) => FIRST + i * 60,
);
const pct = (m: number) => `${((m - FIRST) / (LAST - FIRST)) * 100}%`;
const short = (s: Slot) =>
  `${s.name.slice(0, 3).toUpperCase()} ${formatTime(s.start)}–${formatTime(s.end)}`;

/** The ticking clock; null until the page is in the browser. */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock only exists in the browser
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** The small status light under the title: the heart, beating while someone's in. */
export function OfficeLight() {
  const now = useNow();
  const status = now ? officeStatus(now) : null;
  return (
    <span
      className={`${styles.light} ${status?.open ? styles.lightOpen : ""}`}
      role="status"
    >
      <Heart size={20} beating={!!status?.open} />
      {status ? status.text : "Checking the office..."}
      {status?.open && (
        <span className={styles.lightRoom}>in {OFFICE_ROOM}</span>
      )}
    </span>
  );
}

/** A calendar file for the next time this slot comes round, in Calgary time. */
function visitFile(slot: Slot, now: Date) {
  const { day, minutes } = nowInCalgary(now);
  let ahead = (slot.day - day + 7) % 7;
  if (ahead === 0 && minutes >= slot.end) ahead = 7;
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  const date = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2] + ahead));
  const d = date.toISOString().slice(0, 10).replace(/-/g, "");
  const t = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}00`;
  const stamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Science Sphere//Office hours//EN",
    "BEGIN:VEVENT",
    `UID:${d}-${slot.day}@science-sphere`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TIME_ZONE}:${d}T${t(slot.start)}`,
    `DTEND;TZID=${TIME_ZONE}:${d}T${t(slot.end)}`,
    "SUMMARY:Science Sphere office hours",
    `LOCATION:${OFFICE_ROOM}\\, Mount Royal University`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * The office hours. The section holds still while you scroll through it: the
 * days switch on one by one and each day's block springs into existence.
 * Tapping a block picks it in the terminal, which can then save it to your
 * calendar.
 */
export default function ContactOffice() {
  const now = useNow();
  const status = now ? officeStatus(now) : null;
  const cal = now ? nowInCalgary(now) : null;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0); // how many days have sprung in
  const [picked, setPicked] = useState<Slot | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no motion: show everything at once
      setShown(dayHours.length);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const p = Math.max(
        0,
        Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)),
      );
      // the first block lands as the section arrives, the last at about 70%
      const arrived = r.top < window.innerHeight * 0.35;
      setShown(
        arrived ? Math.min(dayHours.length, 1 + Math.floor(p / 0.15)) : 0,
      );
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

  const time = now
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(now)
    : "--:--:--";

  const rows: [string, string, string?][] = [
    ["ROOM", OFFICE_ROOM],
    ["LOCAL TIME", `${time} CGY`],
    [
      "STATUS",
      status ? (status.open ? "OPEN" : "CLOSED") : "...",
      status?.open ? styles.readOpen : styles.readClosed,
    ],
    ["DAYS LOADED", `${shown}/${dayHours.length}`],
  ];

  const save = () => {
    if (!picked || !now) return;
    const blob = new Blob([visitFile(picked, now)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `science-sphere-${picked.name.toLowerCase()}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div ref={wrapRef} className={styles.officeWrap}>
      <div className={styles.officeStage}>
        <p className={`label ${styles.blockLabel}`}>01 {"//"} office hours</p>
        <div className={styles.office}>
          <div className={styles.side}>
            <div className={styles.readout} aria-live="polite">
              {rows.map(([k, v, cls]) => (
                <p key={k} className={styles.readLine}>
                  <span className={styles.prompt}>&gt;</span>
                  <span className={styles.readKey}>{k}</span>
                  <span className={styles.dots} aria-hidden="true" />
                  <span className={cls}>{v}</span>
                </p>
              ))}
              <p className={`${styles.readLine} ${styles.readGap}`}>
                <span className={styles.prompt}>&gt;</span>
                {picked ? (
                  <span>
                    VISIT {short(picked)}
                    <br />
                    <button
                      type="button"
                      className={styles.saveVisit}
                      onClick={save}
                    >
                      [ add to my calendar ↓ ]
                    </button>{" "}
                    <button
                      type="button"
                      className={styles.clearVisit}
                      onClick={() => setPicked(null)}
                    >
                      [ x ]
                    </button>
                  </span>
                ) : (
                  <span className={styles.readHint}>
                    {shown < dayHours.length
                      ? "loading timetable"
                      : "tap a block to plan a visit"}
                    <span className={styles.cursorBlink} aria-hidden="true" />
                  </span>
                )}
              </p>
            </div>
            <OfficeLight />
          </div>

          <div className={styles.week} aria-label="Office hours this week">
            <div className={styles.times} aria-hidden="true">
              {hours.map((h) => (
                <span key={h} style={{ top: pct(h) }}>
                  {formatTime(h).replace(":00", "")}
                </span>
              ))}
            </div>
            {dayHours.map((d, i) => {
              const today = cal?.day === d.day;
              const on = i < shown;
              return (
                <div
                  key={d.day}
                  className={`${styles.dayCol} ${today ? styles.today : ""} ${on ? styles.on : ""}`}
                >
                  <span className={styles.dayName}>
                    {d.name.slice(0, 3)}
                    {today && (
                      <span className={styles.todayMark}>{"//"} today</span>
                    )}
                  </span>
                  <div className={styles.dayTrack}>
                    {hours.slice(1, -1).map((h) => (
                      <span
                        key={h}
                        className={styles.hourLine}
                        style={{ top: pct(h) }}
                      />
                    ))}
                    <button
                      type="button"
                      className={`${styles.slot} ${picked === d ? styles.slotPicked : ""}`}
                      style={{
                        top: pct(d.start),
                        height: `calc(${pct(d.end)} - ${pct(d.start)})`,
                      }}
                      onClick={() => setPicked(picked === d ? null : d)}
                      tabIndex={on ? 0 : -1}
                      aria-label={`${d.name}, ${formatTime(d.start)} to ${formatTime(d.end)}. Plan a visit`}
                    >
                      {formatTime(d.start)}
                      <br />
                      {formatTime(d.end)}
                    </button>
                    {today &&
                      cal &&
                      cal.minutes > FIRST &&
                      cal.minutes < LAST && (
                        <span
                          className={styles.nowLine}
                          style={{ top: pct(cal.minutes) }}
                          aria-hidden="true"
                        />
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
