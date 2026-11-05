import type { Metadata } from "next";
import { workshopOnly } from "@/lib/workshop";

// hidden on the published site; see lib/workshop.ts
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  workshopOnly();
  return children;
}
