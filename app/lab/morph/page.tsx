import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import Morph from "@/components/lab/Morph";

export const metadata: Metadata = { title: "Prototype 05 · Morphing · Science Sphere" };

export default function MorphPrototype() {
  return (
    <LabShell current="morph" hint="tap to morph · or wait · move and drag as before" titlePosition="bottom">
      <Morph />
    </LabShell>
  );
}
