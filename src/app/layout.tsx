import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased grain bg-forest-800 text-cream-100">
        <Header />
        <main className="min-h-screen pt-16 sm:pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
