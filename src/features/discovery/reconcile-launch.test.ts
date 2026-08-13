import { describe, expect, it } from "vitest";

import type { ClankerApiToken } from "../board/types";
import { reconcileLaunchRecord } from "./reconcile-launch";

const creator = "0x1111111111111111111111111111111111111111" as const;
const token = "0x2222222222222222222222222222222222222222" as const;
const txHash = `0x${"3".repeat(64)}` as const;

const candidate: ClankerApiToken = {
  contract_address: token,
  admin: creator,
  msg_sender: creator,
  tx_hash: txHash,
  factory_address: "0xE85A59c628F7d27878ACeB4bf3b35733630083a9",
  name: "Signal",
  symbol: "SIG",
  metadata: {
    description: "A playable TickerBeat release on Base. Listen: ipfs://audio",
    socialMediaUrls: [{ platform: "metadata", url: "ipfs://metadata" }],
  },
  social_context: { interface: "TickerBeat", platform: "TickerBeat", id: "ipfs://metadata" },
};

const event = {
  tokenAddress: token,
  msgSender: creator,
  tokenAdmin: creator,
  tokenContext: JSON.stringify({ interface: "TickerBeat", platform: "TickerBeat", id: "ipfs://metadata" }),
  transactionHash: txHash,
  blockNumber: BigInt(100),
};

describe("reconcileLaunchRecord", () => {
  it("creates an immutable record only when API and factory evidence agree", () => {
    expect(reconcileLaunchRecord(candidate, event)).toEqual({
      chainId: 8453,
      factory: candidate.factory_address,
      token,
      creator,
      admin: creator,
      metadataUri: "ipfs://metadata",
      transactionHash: txHash,
      blockNumber: "100",
    });
  });

  it("rejects conflicting creator or TickerBeat context", () => {
    expect(() => reconcileLaunchRecord(candidate, { ...event, msgSender: token })).toThrow("does not match");
    expect(() => reconcileLaunchRecord(candidate, { ...event, tokenContext: "{}" })).toThrow("does not match");
  });
});
