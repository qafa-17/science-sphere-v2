// This month's pitch meeting, shown on the landing page. Change it here.

export const pitchMeeting = {
  /** the date, as YYYY-MM-DD; the day of the week is worked out from it */
  date: "2026-11-19",
  time: "2:00pm – 4:00pm",
  where: "B231B",
  /**
   * The Google Form for RSVPs. Paste its link between the quotes (the "Send"
   * link from Google Forms, starting https://forms.gle/ or
   * https://docs.google.com/forms/). While it's empty, the button says the
   * RSVP isn't open yet.
   */
  rsvpUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeHHW4etXCPN2n-ZZVN5-XTtHgYPumRUH_0HvPG-cJBlsR-Bw/viewform",
};

/** "Friday, November 20" from "2026-11-20" (read as a calendar date, not a moment in time) */
export function meetingDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "nov 2026" */
export function meetingMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  return `${new Intl.DateTimeFormat("en-CA", {
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(y, m - 1, 1)))
    .replace(".", "")
    .toLowerCase()} ${y}`;
}
