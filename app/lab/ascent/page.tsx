import type { Metadata } from "next";
import Ascent from "@/components/lab/Ascent";
import { Switcher } from "@/components/lab/LabShell";
import styles from "@/components/lab/Lab.module.css";

export const metadata: Metadata = { title: "Prototype 06 · The ascent · Science Sphere" };

export default function AscentPrototype() {
  return (
    <main>
      <Ascent />
      <Switcher current="ascent" hint="scroll to rise · move through the fish" className={styles.fixedSwitcher} />
    </main>
  );
}
