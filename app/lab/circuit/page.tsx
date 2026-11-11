import type { Metadata } from "next";
import CircuitCanvas from "@/components/lab/CircuitCanvas";
import LabShell from "@/components/lab/LabShell";

export const metadata: Metadata = { title: "Prototype 03 · Circuit" };

export default function CircuitPrototype() {
  return (
    <LabShell current="circuit" hint="move over the traces · tap to fire every line" titlePosition="bottom">
      <CircuitCanvas />
    </LabShell>
  );
}
