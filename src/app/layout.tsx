import type { Metadata } from "next";
import { IBM_Plex_Mono, Unbounded } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tickerbeat.vercel.app"),
  title: "TickerBeat — Make a beat. Launch a ticker.",
  description:
    "A browser groovebox where every finished sound can become a token on Base.",
  applicationName: "TickerBeat",
  openGraph: {
    title: "TickerBeat — Sound is the new ticker.",
    description: "Build a loop in the browser, publish its sound, and launch its market on Base.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TickerBeat — Sound is the new ticker.",
    description: "Build a loop in the browser, publish its sound, and launch its market on Base.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable}`}><Providers>{children}</Providers></body>
    </html>
  );
}
