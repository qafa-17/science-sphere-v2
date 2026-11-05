// Science Sphere's office hours in B231B. Change them here and the list,
// the timetable and the "open now" badge all update.

export const OFFICE_ROOM = "B231B";
export const TIME_ZONE = "America/Edmonton"; // Calgary

/** Office hours each weekday (minutes after midnight). 1 = Monday ... 5 = Friday. */
export const dayHours: { day: number; name: string; start: number; end: number }[] = [
  { day: 1, name: "Monday", start: 14 * 60, end: 16 * 60 },
  { day: 2, name: "Tuesday", start: 15 * 60, end: 16 * 60 },
  { day: 3, name: "Wednesday", start: 10 * 60, end: 13 * 60 },
  { day: 4, name: "Thursday", start: 11 * 60, end: 16 * 60 },
  { day: 5, name: "Friday", start: 11 * 60 + 30, end: 13 * 60 + 30 },
];

/** "1:00pm", "11:30am" */
export function formatTime(minutes: number) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")}${h24 < 12 ? "am" : "pm"}`;
}

/** The stretches of time someone is in on a weekday (0 = Sunday ... 6 = Saturday). */
export function openSpans(day: number) {
  return dayHours.filter((d) => d.day === day).map((d) => ({ start: d.start, end: d.end }));
}

/** The day of the week (0 = Sunday) and minutes after midnight, in Calgary. */
export function nowInCalgary(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const dayName = (day: number) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];

/** Is someone in the office right now? If not, when's the next time? */
export function officeStatus(now = new Date()): { open: boolean; text: string } {
  const { day, minutes } = nowInCalgary(now);

  const current = openSpans(day).find((s) => minutes >= s.start && minutes < s.end);
  if (current) return { open: true, text: `Open now, until ${formatTime(current.end)}` };

  // look ahead up to a week for the next opening
  for (let ahead = 0; ahead < 8; ahead++) {
    const d = (day + ahead) % 7;
    const next = openSpans(d).find((s) => ahead > 0 || s.start > minutes);
    if (next) {
      const when = ahead === 0 ? "today" : ahead === 1 ? "tomorrow" : dayName(d);
      return { open: false, text: `Closed now. Next open ${when} at ${formatTime(next.start)}` };
    }
  }
  return { open: false, text: "Closed now" };
}
