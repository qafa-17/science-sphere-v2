import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import SphereCanvas from "@/components/lab/SphereCanvas";

export const metadata: Metadata = { title: "Prototype 01 · Sphere · Science Sphere" };

export default function SpherePrototype() {
  return (
    <LabShell current="sphere" hint="move near it · drag to spin · tap for a shockwave">
      <SphereCanvas />
    </LabShell>
  );
}
