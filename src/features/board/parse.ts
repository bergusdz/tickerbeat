import type { BoardRelease, ClankerApiToken } from "./types";
import type { LaunchRecord } from "../discovery/launch-record";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const audioPattern = /Listen:\s*(ipfs:\/\/[^\s]+)/i;

export function parseTickerBeatRelease(token: ClankerApiToken, record: LaunchRecord): BoardRelease | null {
  const address = token.contract_address;
  const description = token.metadata?.description ?? "";
  const audio = description.match(audioPattern)?.[1] ?? null;
  const metadata = token.metadata?.socialMediaUrls?.find((item) => item.platform === "metadata")?.url ?? null;

  if (
    !address ||
    !addressPattern.test(address) ||
    address.toLowerCase() !== record.token.toLowerCase() ||
    !audio ||
    !token.name ||
    !token.symbol
  ) return null;

  return {
    address: address as `0x${string}`,
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.img_url ?? token.image ?? null,
    audioUrl: audio,
    metadataUrl: metadata,
    deployedAt: token.deployed_at ?? null,
    creator: record.creator,
    transactionHash: record.transactionHash,
    blockNumber: record.blockNumber,
  };
}
