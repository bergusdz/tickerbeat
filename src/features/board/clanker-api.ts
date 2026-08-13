import { createPublicClient, http, isAddress } from "viem";
import { base } from "viem/chains";

import { factoryEventForToken } from "../discovery/factory-event";
import { reconcileLaunchRecord } from "../discovery/reconcile-launch";
import { parseTickerBeatRelease } from "./parse";
import type { BoardRelease, ClankerApiToken } from "./types";

const CLANKER_TOKENS_API = "https://www.clanker.world/api/tokens";
const CLANKER_REQUEST_TIMEOUT_MS = 8_000;
const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});

async function clankerTokens(query: URLSearchParams): Promise<ClankerApiToken[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLANKER_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${CLANKER_TOKENS_API}?${query}`, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: ClankerApiToken[] };
    return payload.data ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function verifiedRelease(candidate: ClankerApiToken): Promise<BoardRelease | null> {
  if (
    !candidate.contract_address ||
    !isAddress(candidate.contract_address) ||
    !candidate.tx_hash ||
    !/^0x[0-9a-fA-F]{64}$/.test(candidate.tx_hash)
  ) return null;

  try {
    const receipt = await baseClient.getTransactionReceipt({
      hash: candidate.tx_hash as `0x${string}`,
    });
    const event = factoryEventForToken(receipt.logs, candidate.contract_address);
    if (!event) return null;
    const record = reconcileLaunchRecord(candidate, event);
    return parseTickerBeatRelease(candidate, record);
  } catch {
    return null;
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
  const releases = await Promise.all((await clankerTokens(query)).map(verifiedRelease));
  return releases.filter((release) => release !== null);
}

export async function getTickerBeatRelease(address: string): Promise<BoardRelease | null> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
  const query = new URLSearchParams({ q: address, chainId: "8453", limit: "5", includeMarket: "true" });
  const tokens = await clankerTokens(query);
  const exact = tokens.find((token) => token.contract_address?.toLowerCase() === address.toLowerCase());
  return exact ? verifiedRelease(exact) : null;
}
