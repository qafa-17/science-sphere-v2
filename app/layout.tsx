import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/pixelify-sans/600.css";
import "./globals.css";
import CpuCursor from "@/components/CpuCursor";
import Header from "@/components/Header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { MAIN_EMAIL } from "@/lib/pitch";

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

// Tells search engines this is Science Sphere's own, official site.
const officialSite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: SITE_TAGLINE,
      description: "The student science magazine at Mount Royal University.",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo.webp`,
      email: MAIN_EMAIL,
      sameAs: ["https://www.instagram.com/mrusciencesphere/"],
      parentOrganization: { "@type": "CollegeOrUniversity", name: "Mount Royal University", url: "https://www.mtroyal.ca" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: SITE_TAGLINE,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-CA",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/* browser extensions like Grammarly add attributes to <body>; that is not an error */}
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          // the official-site data above, as text (with "<" escaped so it can't end the script early)
          dangerouslySetInnerHTML={{ __html: JSON.stringify(officialSite).replace(/</g, "\\u003c") }}
        />
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
