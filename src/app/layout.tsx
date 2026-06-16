import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? "https://katz.wtf" : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "כץ — עושה את זה קצר",
  description: "כץ — עושה את זה קצר. מקצר הלינקים הפנים-ארגוני.",
  openGraph: {
    title: "כץ — עושה את זה קצר",
    description: "מקצר הלינקים הפנים-ארגוני.",
    images: ["/katz-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "כץ — עושה את זה קצר",
    description: "מקצר הלינקים הפנים-ארגוני.",
    images: ["/katz-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="app-bg font-sans antialiased">{children}</body>
    </html>
  );
}
