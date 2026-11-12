// For now, a pitch is sent by opening the person's own email app with the
// pitch already written out, addressed to the magazine inbox (PITCH_TO).
// Real sending from the website comes later.
import { PITCH_TO, type Pitch, storyTypes, subjects } from "./pitch";

function labels(p: Pitch) {
  const type = storyTypes.find((t) => t.id === p.type)?.name ?? p.type;
  const subject = subjects.find((s) => s.id === p.subject)?.label ?? p.subject;
  return {
    type: p.type === "idea" ? `${type}: ${p.typeOther.trim()}` : type,
    subject: p.subject === "other" ? p.subjectOther.trim() : subject,
  };
}

/** The pitch as plain text, for the email and for the "Copy my pitch" button. */
export function pitchText(p: Pitch) {
  const l = labels(p);
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

/** A mailto: link to the magazine inbox with the subject and the pitch filled in. */
export function pitchMailto(p: Pitch) {
  const l = labels(p);
  const subject = `Pitch: ${l.type} · ${l.subject} · ${p.name.trim()}`;
  const body = pitchText(p).replace(/\n/g, "\r\n");
  return `mailto:${PITCH_TO.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
