import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TikTokPixel from "@/components/TikTokPixel";
import { Suspense } from "react";
import "./globals.css";

const SITE_URL = "https://rihoso.com";
const LOGO_PATH = "/rihoso-logo.jpeg";

/** Tells search engines and AI assistants who RIHOSO is and which logo is ours. */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: "Rhode Island Horological Society",
  alternateName: "RIHOSO",
  url: SITE_URL,
  logo: `${SITE_URL}${LOGO_PATH}`,
  image: `${SITE_URL}${LOGO_PATH}`,
  email: "membership@rihoso.com",
  description:
    "A Rhode Island nonprofit community for watch collectors, enthusiasts and watchmakers. Membership is $120 per year.",
  areaServed: "Rhode Island",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RIHOSO — Rhode Island Horological Society",
    template: "%s | RIHOSO",
  },
  description:
    "Time, History, Art, Science, Education, and Tradition. The Rhode Island Horological Society preserves the legacy of horology through community, education, and passion.",
  keywords: [
    "horology",
    "Rhode Island",
    "watchmaking",
    "clocks",
    "horological society",
    "RIHOSO",
  ],
  openGraph: {
    title: "RIHOSO — Rhode Island Horological Society",
    description:
      "Preserving the Legacy of Horology. Time, History, Art, Science, Education, and Tradition.",
    siteName: "RIHOSO",
    type: "website",
    images: [
      {
        url: LOGO_PATH,
        width: 1008,
        height: 1024,
        alt: "Rhode Island Horological Society seal",
      },
    ],
  },
  twitter: {
    card: "summary",
    images: [LOGO_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased grain bg-forest-800 text-cream-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <Header />
        <main className="min-h-screen pt-16 sm:pt-20">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <TikTokPixel />
        </Suspense>
      </body>
    </html>
  );
}
