import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Download 500+ expert advisors, MT4/MT5 indicators, and automated trading systems updated daily for serious Forex traders.",
  keywords: [
    "forex expert advisors",
    "mt4 robots",
    "mt5 ea",
    "automated trading",
    "forex signals",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description:
      "ForexFactory.cc offers premium-grade trading robots, indicators, and SEO-rich content for algorithmic traders.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} hero image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@forexfactorycc",
    site: "@forexfactorycc",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description:
      "Free Forex EAs, MT4/MT5 robots, and AI-enhanced SEO content to grow your trading business.",
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface-100 text-white min-h-screen`}
      >
        <div className="relative min-h-screen bg-gradient-to-b from-surface-50 via-surface-100 to-black">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(10,132,255,0.15),_transparent_55%)]" />
          <div className="relative z-10 flex min-h-screen flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
