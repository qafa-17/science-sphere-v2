import type { Metadata } from "next";
import IssueArchive from "@/components/IssueArchive";
import { issues } from "@/lib/issues";

export const metadata: Metadata = {
  title: "Issues · Science Sphere",
  description: "Every issue of Science Sphere, MRU's student science magazine, to read right here.",
};

export default function IssuesPage() {
  return (
    <main>
      <IssueArchive issues={issues} />
    </main>
  );
}
