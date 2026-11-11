import type { Metadata } from "next";
import Dive from "@/components/lab/Dive";
import { Switcher } from "@/components/lab/LabShell";
import styles from "@/components/lab/Lab.module.css";

export const metadata: Metadata = { title: "Prototype 04 · The dive" };

export default function DivePrototype() {
  return (
    <main>
      <Dive />
      <Switcher current="dive" hint="scroll to dive · move and tap as before" className={styles.fixedSwitcher} />
    </main>
  );
}
