"use server";

// Sending a pitch, in two steps:
//   1. preparePitch: the form asks for upload links, one per file, and the
//      browser sends the files straight to Supabase Storage (they're too big to
//      pass through the website itself).
//   2. sendPitch: the form sends what was typed. It's checked again here, saved
//      in the pitches table, and emailed to the magazine inbox (with links to
//      the files), plus a thank-you email to the person who pitched.
// Setup: see "Pitches: Supabase and email" in the README.

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { MAX_FILES, MAX_FILE_MB, PITCH_TO, type PitchErrors, type PitchFields, checkPitch } from "@/lib/pitch";
import { emailConfigured, sendEmail } from "@/lib/server/email";
import { type SavedFile, inboxEmail, thanksEmail } from "@/lib/server/pitchEmails";
import { supabaseAdmin } from "@/lib/server/supabase";

const BUCKET = "pitch-files";
/** How long the file links in the inbox email keep working. The files themselves stay in Supabase. */
const FILE_LINK_DAYS = 30;
/** At most this many pitches an hour from one internet address. */
const PER_HOUR = 5;

const NOT_SET_UP = `Pitches can't be sent from the website just yet. Please email your pitch to ${PITCH_TO[0]} instead.`;
const WENT_WRONG = `Something went wrong sending your pitch. Please try again, or email it to ${PITCH_TO[0]}.`;

export type FileInfo = { name: string; size: number; type: string };
export type Upload = { name: string; path: string; size: number; url: string; contentType: string };
export type PrepareResult = { ok: true; id: string; uploads: Upload[] } | { ok: false; error: string };
export type SendResult = { ok: true } | { ok: false; error: string; fields?: PitchErrors };

/** A file name that's safe in a storage path: letters, numbers, dots, dashes. */
function safeName(name: string) {
  const clean = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-\./g, ".")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-80);
  return clean || "file";
}

/** A scrambled form of the sender's internet address: enough to spot a flood, without storing the address. */
async function senderHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

async function tooMany(hash: string) {
  const db = supabaseAdmin();
  if (!db) return false;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db.from("pitches").select("id", { count: "exact", head: true }).eq("sender_hash", hash).gte("created_at", since);
  return (count ?? 0) >= PER_HOUR;
}

export async function preparePitch(files: FileInfo[]): Promise<PrepareResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: NOT_SET_UP };
  if (!Array.isArray(files) || files.length > MAX_FILES) return { ok: false, error: `Please attach at most ${MAX_FILES} files.` };
  const big = files.find((f) => typeof f?.size !== "number" || f.size <= 0 || f.size > MAX_FILE_MB * 1024 * 1024);
  if (big) return { ok: false, error: `${String(big?.name ?? "A file")} is empty or over ${MAX_FILE_MB}MB. You can put a link to it in your pitch instead.` };
  if (await tooMany(await senderHash())) return { ok: false, error: "That's a lot of pitches in one hour! Please try again a bit later." };

  const id = randomUUID();
  const uploads: Upload[] = [];
  for (const [i, f] of files.entries()) {
    const path = `${id}/${i + 1}-${safeName(String(f.name))}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("pitch: could not make an upload link", error);
      return { ok: false, error: WENT_WRONG };
    }
    uploads.push({
      name: String(f.name).slice(0, 200),
      path,
      size: f.size,
      url: data.signedUrl,
      contentType: typeof f.type === "string" && /^[\w.+-]+\/[\w.+-]+$/.test(f.type) ? f.type : "application/octet-stream",
    });
  }
  return { ok: true, id, uploads };
}

export async function sendPitch(
  id: string,
  pitch: PitchFields,
  files: { name: string; path: string }[],
  /** a box people can't see; only robots fill it in */
  website: string,
): Promise<SendResult> {
  // a robot: pretend it worked, and keep nothing
  if (website) return { ok: true };

  const db = supabaseAdmin();
  if (!db) return { ok: false, error: NOT_SET_UP };
  if (!/^[0-9a-f-]{36}$/.test(id) || !Array.isArray(files) || files.length > MAX_FILES) return { ok: false, error: WENT_WRONG };

  // only the fields we know, as text, so nothing extra sneaks into the table
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const p: PitchFields = {
    name: str(pitch?.name).trim(),
    email: str(pitch?.email).trim(),
    program: str(pitch?.program).trim(),
    year: str(pitch?.year),
    type: str(pitch?.type),
    typeOther: str(pitch?.typeOther).trim(),
    subject: str(pitch?.subject),
    subjectOther: str(pitch?.subjectOther).trim(),
    formats: Array.isArray(pitch?.formats) ? pitch.formats.map(str) : [],
    angle: str(pitch?.angle).trim(),
    why: str(pitch?.why).trim(),
  };
  if (p.type !== "idea") p.typeOther = "";
  if (p.subject !== "other") p.subjectOther = "";
  const fields = checkPitch(p);
  if (Object.keys(fields).length) return { ok: false, error: "Some answers need another look.", fields };

  const hash = await senderHash();
  if (await tooMany(hash)) return { ok: false, error: "That's a lot of pitches in one hour! Please try again a bit later." };

  // the files must be ones uploaded for this pitch, and really be there
  const saved: (SavedFile & { path: string })[] = [];
  if (files.length) {
    const { data: listed, error } = await db.storage.from(BUCKET).list(id, { limit: 100 });
    if (error) {
      console.error("pitch: could not list the files", error);
      return { ok: false, error: WENT_WRONG };
    }
    for (const f of files) {
      const path = str(f?.path);
      const found = path.startsWith(`${id}/`) && listed?.find((o) => `${id}/${o.name}` === path);
      if (!found) return { ok: false, error: `${str(f?.name) || "A file"} didn't finish uploading. Please try sending again.` };
      saved.push({ name: str(f.name).slice(0, 200) || found.name, path, size: Number(found.metadata?.size ?? 0) });
    }
  }

  const { error: insertError } = await db.from("pitches").insert({
    id,
    name: p.name,
    email: p.email,
    program: p.program,
    year: p.year,
    story_type: p.type,
    story_type_other: p.typeOther,
    subject: p.subject,
    subject_other: p.subjectOther,
    formats: p.formats,
    angle: p.angle,
    why: p.why,
    files: saved.map(({ name, path, size }) => ({ name, path, size })),
    sender_hash: hash,
  });
  if (insertError) {
    // 23505: this pitch was already saved (e.g. the button was pressed twice)
    if (insertError.code === "23505") return { ok: true };
    console.error("pitch: could not save", insertError);
    return { ok: false, error: WENT_WRONG };
  }

  // From here on the pitch is safe in Supabase, so a failed email doesn't fail the pitch:
  // the editors can still find it in the pitches table (emailed = false).
  if (!emailConfigured()) {
    console.warn("pitch: saved, but email isn't set up (RESEND_API_KEY / PITCH_FROM_EMAIL), so nobody was emailed");
    return { ok: true };
  }

  for (const f of saved) {
    const { data } = await db.storage.from(BUCKET).createSignedUrl(f.path, FILE_LINK_DAYS * 24 * 60 * 60, { download: f.name });
    f.link = data?.signedUrl;
  }

  const inbox = inboxEmail(p, saved, FILE_LINK_DAYS);
  const toInbox = await sendEmail({ to: PITCH_TO, replyTo: p.email, ...inbox });
  if (toInbox.ok) await db.from("pitches").update({ emailed: true }).eq("id", id);
  else console.error("pitch: saved, but the inbox email failed:", toInbox.error);

  const thanks = await sendEmail({ to: [p.email], replyTo: PITCH_TO[0], ...thanksEmail(p) });
  if (!thanks.ok) console.error("pitch: the thank-you email failed:", thanks.error);

  return { ok: true };
}
