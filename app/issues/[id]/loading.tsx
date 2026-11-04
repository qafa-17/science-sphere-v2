// Shown for a moment while an issue opens. It also lets the reader page wait
// for the issue number in the address without holding up the navigation.
export default function Loading() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "grid",
        placeItems: "center",
        background: "#0b0c0e",
        color: "#ebe8df",
      }}
    >
      <p className="label">opening issue...</p>
    </main>
  );
}
