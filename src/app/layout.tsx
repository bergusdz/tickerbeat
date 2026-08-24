import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Unbounded } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tickerbeat.vercel.app"),
  title: "TickerBeat — Make sound. Make market.",
  description:
    "A browser groovebox where you build a short loop, publish the sound, and launch its market on Base.",
  applicationName: "TickerBeat",
  openGraph: {
    title: "TickerBeat — Make sound. Make market.",
    description: "Build a loop in the browser, publish its sound, and launch its market on Base.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TickerBeat — Make sound. Make market.",
    description: "Build a loop in the browser, publish its sound, and launch its market on Base.",
  },
};

export const viewport: Viewport = {
  themeColor: "#070605",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
