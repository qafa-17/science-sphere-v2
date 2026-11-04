import Link from "next/link";

// TEMPORARY: the landing page comes after the look and feel board is agreed.
export default function Home() {
  return (
    <main className="wrap" style={{ padding: "96px 32px" }}>
      <p className="label">status // building</p>
      <h1 style={{ fontSize: "var(--text-h1)", margin: "12px 0 20px" }}>Science Sphere, v2</h1>
      <p>
        See the <Link href="/board">look and feel board</Link>, or try the three landing-page prototypes:{" "}
        <Link href="/lab/sphere">sphere</Link>, <Link href="/lab/sky">pixel sky</Link> and{" "}
        <Link href="/lab/circuit">circuit</Link>. Issue 3 still opens in the reader at <Link href="/issues/3">/issues/3</Link>.
      </p>
    </main>
  );
}
