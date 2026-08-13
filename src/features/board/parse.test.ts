import { describe, expect, it } from "vitest";

import { parseTickerBeatRelease } from "./parse";

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
      }),
    ).toEqual({
      address: "0x1111111111111111111111111111111111111111",
      name: "Acid Broadcast",
      symbol: "ACID",
      imageUrl: "https://gateway.test/ipfs/cover",
      audioUrl: "ipfs://audio",
      metadataUrl: "ipfs://metadata",
      deployedAt: "2026-08-13T00:00:00.000Z",
    });
    expect(parseTickerBeatRelease({ name: "Unrelated", symbol: "NO" })).toBeNull();
  });
});
