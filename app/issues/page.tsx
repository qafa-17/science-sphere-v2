import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import IssueArchive from "@/components/IssueArchive";
import { issues } from "@/lib/issues";

export const metadata: Metadata = pageMeta({
  title: "Issues",
  description: "Every issue of Science Sphere, MRU's student science magazine, to read right here.",
  path: "/issues",
});

export default function IssuesPage() {
  return (
    <main>
      <IssueArchive issues={issues} />
    </main>
  );
}
