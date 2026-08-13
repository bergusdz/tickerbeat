import { describe, expect, it } from "vitest";

import { parseTickerBeatRelease } from "./parse";

const record = {
  chainId: 8453 as const,
  factory: "0xE85A59c628F7d27878ACeB4bf3b35733630083a9" as const,
  token: "0x1111111111111111111111111111111111111111" as const,
  creator: "0x2222222222222222222222222222222222222222" as const,
  admin: "0x2222222222222222222222222222222222222222" as const,
  metadataUri: "ipfs://metadata",
  transactionHash: `0x${"3".repeat(64)}` as `0x${string}`,
  blockNumber: "100",
};

describe("TickerBeat release parser", () => {
  it("accepts only Clanker tokens carrying TickerBeat metadata", () => {
    expect(
      parseTickerBeatRelease({
        contract_address: "0x1111111111111111111111111111111111111111",
        name: "Acid Broadcast",
        symbol: "ACID",
        img_url: "https://gateway.test/ipfs/cover",
        metadata: {
          description: "A playable TickerBeat release on Base. Listen: ipfs://audio",
          socialMediaUrls: [{ platform: "metadata", url: "ipfs://metadata" }],
        },
        social_context: { interface: "TickerBeat", platform: "TickerBeat" },
        deployed_at: "2026-08-13T00:00:00.000Z",
      }, record),
    ).toEqual({
      address: "0x1111111111111111111111111111111111111111",
      name: "Acid Broadcast",
      symbol: "ACID",
      imageUrl: "https://gateway.test/ipfs/cover",
      audioUrl: "ipfs://audio",
      metadataUrl: "ipfs://metadata",
      deployedAt: "2026-08-13T00:00:00.000Z",
      creator: record.creator,
      transactionHash: record.transactionHash,
      blockNumber: record.blockNumber,
    });
    expect(parseTickerBeatRelease({ name: "Unrelated", symbol: "NO" }, record)).toBeNull();
  });
});
