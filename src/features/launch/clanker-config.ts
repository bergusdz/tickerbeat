import {
  getTickFromMarketCap,
  POOL_POSITIONS,
  PoolPositions,
  type ClankerTokenV4,
} from "clanker-sdk";

export type ClankerConfigInput = {
  creator: `0x${string}`;
  title: string;
  symbol: string;
  coverUri: string;
  audioUri: string;
  metadataUri: string;
};

export function createClankerTokenConfig({
  creator,
  title,
  symbol,
  coverUri,
  audioUri,
  metadataUri,
}: ClankerConfigInput): ClankerTokenV4 {
  const initialPool = getTickFromMarketCap(10);

  return {
    chainId: 8453,
    name: title,
    symbol,
    tokenAdmin: creator,
    image: coverUri,
    metadata: {
      description: `A playable TickerBeat release on Base. Listen: ${audioUri}`,
      socialMediaUrls: [{ platform: "metadata", url: metadataUri }],
    },
    context: {
      interface: "TickerBeat",
      platform: "TickerBeat",
      id: metadataUri,
    },
    pool: {
      pairedToken: "WETH",
      tickIfToken0IsClanker: initialPool.tickIfToken0IsClanker,
      tickSpacing: initialPool.tickSpacing,
      positions: POOL_POSITIONS[PoolPositions.Standard],
    },
    rewards: {
      recipients: [{ admin: creator, recipient: creator, bps: 10_000, token: "Both" }],
    },
  };
}
