import type { Metadata } from "next";
import Journey from "@/components/lab/Journey";
import { Switcher } from "@/components/lab/LabShell";
import styles from "@/components/lab/Lab.module.css";

export const metadata: Metadata = { title: "Prototype 06 · The journey · Science Sphere" };

export default function JourneyPrototype() {
  return (
    <main>
      <Journey />
      <Switcher current="journey" hint="scroll down · drag the sphere · move through the stars and fish" className={styles.fixedSwitcher} />
    </main>
  );
}
