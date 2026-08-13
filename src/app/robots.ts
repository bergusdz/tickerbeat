import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://tickerbeat.vercel.app";
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${origin}/sitemap.xml` };
}
