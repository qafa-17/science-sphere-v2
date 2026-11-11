// The two emails a pitch sends: one to the magazine inbox, one thanking the person who pitched.
import { MAIN_EMAIL, type PitchFields, pitchLabels } from "@/lib/pitch";
import { SITE_URL } from "@/lib/site";
import { esc } from "./email";

export type SavedFile = { name: string; size: number; link?: string };

const mb = (bytes: number) => (bytes < 100 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`);
const para = (s: string) => esc(s.trim()).replace(/\n/g, "<br>");

const shell = (body: string) => `<!doctype html><html><body style="margin:0;padding:24px;background:#ebe8df;color:#0b0c0e;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55">
<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #d6d2c6;padding:28px">${body}</div></body></html>`;

/** To the magazine inbox. Hitting Reply answers the person who pitched. */
export function inboxEmail(p: PitchFields, files: SavedFile[], linkDays: number) {
  const l = pitchLabels(p);
  const rows: [string, string][] = [
    ["Name", p.name],
    ["Email", p.email],
    ["Program", p.program],
    ["Year", p.year],
    ["Type of story", l.type],
    ["Subject", l.subject],
    ["Format", p.formats.join(", ")],
  ];
  if (l.editor) rows.push(["Editor for this subject", `${l.editor.name} (${l.editor.role})`]);

  const subject = `New pitch: ${l.type} · ${l.subject} · ${p.name.trim()}`;
  const fileText = files.length
    ? files.map((f) => `- ${f.name} (${mb(f.size)})${f.link ? `\n  ${f.link}` : ""}`).join("\n")
    : "No files.";
  const text = [
    `New pitch from ${p.name.trim()} (${p.email.trim()}). Reply to this email to answer them directly.`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "THE PITCH",
    p.angle.trim(),
    "",
    "WHY SCIENCE SPHERE",
    p.why.trim(),
    "",
    "FILES",
    fileText,
    files.length ? `(These links work for ${linkDays} days. The files are also in Supabase → Storage → pitch-files.)` : "",
  ].join("\n");

  const html = shell(`
<p style="margin:0 0 4px;font-family:monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6d72">specimen // new pitch</p>
<h1 style="margin:0 0 16px;font-size:22px">${esc(l.type)} · ${esc(l.subject)}</h1>
<p style="margin:0 0 18px">From <strong>${esc(p.name.trim())}</strong>. Reply to this email to answer them directly.</p>
<table style="border-collapse:collapse;width:100%;margin-bottom:20px">
${rows.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b6d72;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join("\n")}
</table>
<h2 style="margin:0 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.04em">The pitch</h2>
<p style="margin:0 0 18px">${para(p.angle)}</p>
<h2 style="margin:0 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.04em">Why Science Sphere</h2>
<p style="margin:0 0 18px">${para(p.why)}</p>
<h2 style="margin:0 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.04em">Files</h2>
${
  files.length
    ? `<ul style="margin:0 0 8px;padding-left:20px">${files
        .map((f) => `<li>${f.link ? `<a href="${esc(f.link)}">${esc(f.name)}</a>` : esc(f.name)} <span style="color:#6b6d72">(${mb(f.size)})</span></li>`)
        .join("")}</ul>
<p style="margin:0;color:#6b6d72;font-size:13px">These links work for ${linkDays} days. The files are also in Supabase → Storage → pitch-files.</p>`
    : `<p style="margin:0">No files.</p>`
}`);

  return { subject, text, html };
}

/** To the person who pitched, so they know it arrived. Their reply goes to the magazine inbox. */
export function thanksEmail(p: PitchFields) {
  const l = pitchLabels(p);
  const first = p.name.trim().split(/\s+/)[0];
  const subject = "We got your pitch! · Science Sphere";
  const text = [
    `Hi ${first},`,
    "",
    "Thank you for pitching to Science Sphere! Your idea is with the editors, and we usually reply within a week.",
    "",
    `Your pitch (${l.type}, ${l.subject}):`,
    p.angle.trim(),
    "",
    `Questions in the meantime? Just reply to this email, or write to ${MAIN_EMAIL}.`,
    "",
    "The Science Sphere team",
    SITE_URL,
  ].join("\n");
  const html = shell(`
<p style="margin:0 0 4px;font-family:monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6d72">transmission received</p>
<h1 style="margin:0 0 16px;font-size:22px">Thank you, ${esc(first)}!</h1>
<p>Your pitch is with the editors, and we usually reply within a week.</p>
<div style="margin:18px 0;padding:14px 16px;background:#f6f1bc;border-left:4px solid #788417">
<p style="margin:0 0 6px;font-family:monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${esc(l.type)} · ${esc(l.subject)}</p>
<p style="margin:0">${para(p.angle)}</p>
</div>
<p>Questions in the meantime? Just reply to this email, or write to <a href="mailto:${MAIN_EMAIL}">${MAIN_EMAIL}</a>.</p>
<p style="margin:18px 0 0">The Science Sphere team<br><a href="${esc(SITE_URL)}">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</a></p>`);
  return { subject, text, html };
}
