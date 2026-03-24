import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Brandon Salomon — AI Leadership & Consulting",
    template: "%s | Brandon Salomon",
  },
  description:
    "Helping organizations navigate AI transformation through leadership consulting, team training, and strategic implementation. Speaker, consultant, and AI integration expert.",
  keywords: [
    "AI consulting",
    "AI leadership",
    "AI training",
    "digital transformation",
    "speaking engagements",
    "team training",
    "Brandon Salomon",
  ],
  openGraph: {
    title: "Brandon Salomon — AI Leadership & Consulting",
    description:
      "Helping organizations navigate AI transformation through leadership consulting, team training, and strategic implementation.",
    siteName: "Brandon Salomon",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-sand-100 text-navy-800">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
