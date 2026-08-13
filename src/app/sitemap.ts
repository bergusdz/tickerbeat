import type { MetadataRoute } from "next";

import { getTickerBeatReleases } from "@/features/board/clanker-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://tickerbeat.vercel.app";
  const releases = await getTickerBeatReleases();
  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    ...releases.map((release) => ({
      url: `${origin}/track/${release.address}`,
      lastModified: release.deployedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
