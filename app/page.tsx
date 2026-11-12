import Landing from "@/components/landing/Landing";
import { issues } from "@/lib/issues";

export default function Home() {
  return (
    <main>
      <Landing issues={issues} />
    </main>
  );
}
