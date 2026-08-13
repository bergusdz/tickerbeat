import type { BoardRelease, ClankerApiToken } from "./types";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const audioPattern = /Listen:\s*(ipfs:\/\/[^\s]+)/i;

export function parseTickerBeatRelease(token: ClankerApiToken): BoardRelease | null {
  const address = token.contract_address;
  const description = token.metadata?.description ?? "";
  const audio = description.match(audioPattern)?.[1] ?? null;
  const metadata = token.metadata?.socialMediaUrls?.find((item) => item.platform === "metadata")?.url ?? null;

  const isTickerBeat = token.social_context?.interface === "TickerBeat" || description.includes("TickerBeat");
  if (!isTickerBeat || !address || !addressPattern.test(address) || !audio || !token.name || !token.symbol) return null;

  return {
    address: address as `0x${string}`,
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.img_url ?? token.image ?? null,
    audioUrl: audio,
    metadataUrl: metadata,
    deployedAt: token.deployed_at ?? null,
  };
}
