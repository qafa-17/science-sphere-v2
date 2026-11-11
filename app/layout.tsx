import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/pixelify-sans/600.css";
import "./globals.css";
import CpuCursor from "@/components/CpuCursor";
import Header from "@/components/Header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

// Each page sets its own title ("Issues"), and the template adds " · Science Sphere".
// The share preview image is app/opengraph-image.png (every page uses it unless it has its own).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_CA",
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
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
