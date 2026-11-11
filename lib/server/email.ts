// Sends email through Resend (resend.com), using its web API directly.
//
// RESEND_API_KEY      the API key from Resend → API Keys
// PITCH_FROM_EMAIL    who the emails come from, e.g. "Science Sphere <pitches@sciencesphere.ca>".
//                     It must be on a domain verified in Resend → Domains. While testing,
//                     "Science Sphere <onboarding@resend.dev>" works, but then Resend only
//                     delivers to the email address of the Resend account itself.

export type Email = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.PITCH_FROM_EMAIL);
}

export async function sendEmail(email: Email): Promise<{ ok: boolean; error?: string }> {
  if (!emailConfigured()) return { ok: false, error: "email is not set up (RESEND_API_KEY / PITCH_FROM_EMAIL)" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.PITCH_FROM_EMAIL,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend said ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Makes text safe to put inside an email's HTML. */
export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
