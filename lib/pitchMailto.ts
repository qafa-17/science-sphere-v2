// The stopgap way to send a pitch: open the person's own email app with the
// pitch already written out, addressed to the magazine inbox. Used while real
// sending (app/pitch/actions.ts) isn't set up on the live site.
import { PITCH_TO, type Pitch, pitchLabels } from "./pitch";

/** The pitch as plain text, for the email and for the "copy my pitch" button. */
export function pitchText(p: Pitch) {
  const l = pitchLabels(p);
  const lines = [
    `Name: ${p.name.trim()}`,
    `Email: ${p.email.trim()}`,
    `Degree and program: ${p.program.trim()}`,
    `Year: ${p.year}`,
    `Type of story: ${l.type}`,
    `Subject: ${l.subject}`,
    `Format: ${p.formats.join(", ")}`,
    "",
    "THE PITCH",
    p.angle.trim(),
    "",
    "WHY SCIENCE SPHERE",
    p.why.trim(),
  ];
  if (p.files.length) lines.push("", "FILES", `Attached to this email: ${p.files.map((f) => f.name).join(", ")}`);
  lines.push("", "Sent from the Pitch a Story form at sciencesphere.ca");
  return lines.join("\n");
}

export function pitchSubject(p: Pitch) {
  const l = pitchLabels(p);
  return `Pitch: ${l.type} · ${l.subject} · ${p.name.trim()}`;
}

/** A mailto: link to the magazine inbox with the subject and the pitch filled in. */
export function pitchMailto(p: Pitch) {
  const body = pitchText(p).replace(/\n/g, "\r\n");
  return `mailto:${PITCH_TO.join(",")}?subject=${encodeURIComponent(pitchSubject(p))}&body=${encodeURIComponent(body)}`;
}
