import { notFound } from "next/navigation";

/**
 * The workshop pages (the look and feel board and the landing prototypes) are
 * only for us. On the published site (Vercel sets VERCEL=1 when it builds) they
 * act as if they don't exist; on your own computer they still open as usual,
 * with npm run dev or npm start.
 */
export function workshopOnly() {
  if (process.env.VERCEL) notFound();
}
