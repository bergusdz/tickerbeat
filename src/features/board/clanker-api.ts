import { parseTickerBeatRelease } from "./parse";
import type { BoardRelease, ClankerApiToken } from "./types";

const CLANKER_TOKENS_API = "https://www.clanker.world/api/tokens";

async function clankerTokens(query: URLSearchParams): Promise<ClankerApiToken[]> {
  try {
    const response = await fetch(`${CLANKER_TOKENS_API}?${query}`, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: ClankerApiToken[] };
    return payload.data ?? [];
  } catch {
    return [];
  }
}

export async function getTickerBeatReleases(): Promise<BoardRelease[]> {
  const query = new URLSearchParams({
    socialInterface: "TickerBeat",
    chainId: "8453",
    sortBy: "deployed-at",
    sort: "desc",
    limit: "20",
  });
  return (await clankerTokens(query)).map(parseTickerBeatRelease).filter((release) => release !== null);
}

export async function getTickerBeatRelease(address: string): Promise<BoardRelease | null> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
  const query = new URLSearchParams({ q: address, chainId: "8453", limit: "5", includeMarket: "true" });
  const tokens = await clankerTokens(query);
  const exact = tokens.find((token) => token.contract_address?.toLowerCase() === address.toLowerCase());
  return exact ? parseTickerBeatRelease(exact) : null;
}
