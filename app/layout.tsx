import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@fontsource/doto/800.css";
import "@fontsource/pixelify-sans/600.css";
import "./globals.css";
import CpuCursor from "@/components/CpuCursor";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Science Sphere",
  description: "Science Sphere, the MRU science experience: a student science magazine at Mount Royal University.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/* browser extensions like Grammarly add attributes to <body>; that is not an error */}
      <body suppressHydrationWarning>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Header />
        <div id="main">{children}</div>
        <CpuCursor />
      </body>
    </html>
  );
}
