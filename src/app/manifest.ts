import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TickerBeat",
    short_name: "TickerBeat",
    description: "A browser groovebox where every finished sound can become a token on Base.",
    start_url: "/",
    display: "standalone",
    background_color: "#070605",
    theme_color: "#d8ff3c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
