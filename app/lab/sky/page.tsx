import type { Metadata } from "next";
import LabShell from "@/components/lab/LabShell";
import PixelSkyCanvas from "@/components/lab/PixelSkyCanvas";

export const metadata: Metadata = { title: "Prototype 02 · Pixel sky" };

export default function SkyPrototype() {
  return (
    <LabShell current="sky" hint="move to part the clouds · tap for a ripple" pixelTitle>
      <PixelSkyCanvas />
    </LabShell>
  );
}
