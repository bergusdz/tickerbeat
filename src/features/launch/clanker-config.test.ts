import { Clanker } from "clanker-sdk/v4";
import { describe, expect, it } from "vitest";

import { createClankerTokenConfig } from "./clanker-config";

const creator = "0x1111111111111111111111111111111111111111" as const;

describe("Clanker v4 token configuration", () => {
  it("uses Base, WETH liquidity, no dev buy, and creator-owned rewards", async () => {
    const config = createClankerTokenConfig({
      creator,
      title: "Acid Broadcast 001",
      symbol: "ACID",
      coverUri: "ipfs://bafy-cover",
      audioUri: "ipfs://bafy-audio",
      metadataUri: "ipfs://bafy-metadata",
    });

    expect(config).toMatchObject({
      chainId: 8453,
      name: "Acid Broadcast 001",
      symbol: "ACID",
      tokenAdmin: creator,
      image: "ipfs://bafy-cover",
      pool: { pairedToken: "WETH" },
      fees: { type: "static", clankerFee: 100, pairedFee: 100 },
      sniperFees: {
        startingFee: 666_777,
        endingFee: 41_673,
        secondsToDecay: 15,
      },
      context: { interface: "TickerBeat", platform: "TickerBeat" },
      rewards: {
        recipients: [{ admin: creator, recipient: creator, bps: 10_000, token: "Both" }],
      },
    });
    expect(config.metadata?.description).toContain("ipfs://bafy-audio");
    expect(config.metadata?.socialMediaUrls).toContainEqual({
      platform: "metadata",
      url: "ipfs://bafy-metadata",
    });
    expect(config.devBuy).toBeUndefined();

    const transaction = await new Clanker().getDeployTransaction(config);
    expect(transaction.functionName).toBe("deployToken");
    expect(transaction.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(transaction.expectedAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(transaction.chainId).toBe(8453);
  });
});
