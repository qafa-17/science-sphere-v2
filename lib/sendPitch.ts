// The browser's half of sending a pitch: get upload links, send each file
// straight to Supabase Storage (showing how far along it is), then send the
// answers. The server's half is app/pitch/actions.ts.
import { preparePitch, sendPitch, type SendResult, type Upload } from "@/app/pitch/actions";
import type { Pitch } from "./pitch";

export type Progress = { file: string; index: number; count: number; percent: number };

function upload(u: Upload, file: File, onProgress: (fraction: number) => void) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", u.url);
    xhr.setRequestHeader("content-type", u.contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

export async function submitPitch(pitch: Pitch, website: string, onProgress: (p: Progress | null) => void): Promise<SendResult> {
  const { files, ...fields } = pitch;
  try {
    const prep = await preparePitch(files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
    if (!prep.ok) return prep;

    for (const [i, u] of prep.uploads.entries()) {
      const report = (fraction: number) =>
        onProgress({ file: u.name, index: i + 1, count: prep.uploads.length, percent: Math.round(fraction * 100) });
      report(0);
      if (!(await upload(u, files[i], report))) {
        onProgress(null);
        return { ok: false, error: `${u.name} didn't upload. Check your connection and try again, or put a link to it in your pitch.` };
      }
    }
    onProgress(null);

    return await sendPitch(
      prep.id,
      fields,
      prep.uploads.map((u) => ({ name: u.name, path: u.path })),
      website,
    );
  } catch {
    onProgress(null);
    return { ok: false, error: "Your pitch couldn't reach us. Check your connection and try again." };
  }
}
