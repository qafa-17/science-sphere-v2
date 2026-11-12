import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Flipbook from "@/components/Flipbook";
import { getIssue, issues, pageImages } from "@/lib/issues";
import styles from "./reader.module.css";

// Build a page for every issue ahead of time.
export function generateStaticParams() {
  return issues.map((issue) => ({ id: issue.id }));
}

export async function generateMetadata({ params }: PageProps<"/issues/[id]">): Promise<Metadata> {
  const { id } = await params;
  const issue = getIssue(id);
  return { title: issue ? `Issue #${issue.number} · Science Sphere` : "Issue not found" };
}

export default async function IssueReaderPage({ params }: PageProps<"/issues/[id]">) {
  const { id } = await params;
  const issue = getIssue(id);
  if (!issue) notFound();

  const pages = pageImages(issue);

  const toolbarStart = (
    <>
      <Link href="/issues" className={styles.back}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        All issues
      </Link>
      <h1 className={styles.heading}>
        Issue #{issue.number} <span className={styles.season}>{issue.season}</span>
      </h1>
    </>
  );

  return (
    <main className={styles.reader}>
      <div className={styles.stage}>
        {pages.length > 0 ? (
          <Flipbook
            pages={pages}
            hotspots={issue.hotspots}
            title={`Science Sphere Issue #${issue.number}`}
            toolbarStart={toolbarStart}
          />
        ) : (
          <>
            <div className={styles.emptyBar}>{toolbarStart}</div>
            <p className={styles.empty}>
              The pages for this issue haven&apos;t been uploaded yet. Check back soon!
            </p>
          </>
        )}
      </div>
    </main>
  );
}
