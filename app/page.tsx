import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { issues } from "@/lib/issues";

// the title, description and share image come from app/layout.tsx
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main>
      <Landing issues={issues} />
    </main>
  );
}
