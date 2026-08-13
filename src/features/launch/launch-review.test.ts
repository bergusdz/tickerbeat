import { describe, expect, it } from "vitest";

import {
  assertPublicationCreator,
  assertReviewedLaunch,
  createLaunchReview,
} from "./launch-review";

const expectedAddress = "0x1111111111111111111111111111111111111111" as const;

describe("launch review binding", () => {
  it("builds the complete Base transaction review shown before signing", () => {
    expect(
      createLaunchReview({
        creator: "0x2222222222222222222222222222222222222222",
        expectedAddress,
        metadataUri: "ipfs://bafy-metadata",
        valueWei: BigInt("1250000000000000"),
      }),
    ).toEqual({
      protocol: "Clanker v4",
      network: "Base",
      chainId: 8453,
      creator: "0x2222222222222222222222222222222222222222",
      expectedAddress,
      metadataUri: "ipfs://bafy-metadata",
      valueEth: "0.00125 ETH",
    });
  });

  it("returns the reviewed address when the launch details are unchanged", () => {
    expect(assertReviewedLaunch("config-a", "config-a", expectedAddress)).toBe(expectedAddress);
  });

  it("rejects deployment when launch details changed after simulation", () => {
    expect(() => assertReviewedLaunch("config-a", "config-b", expectedAddress)).toThrow(
      "Launch details changed. Check the launch again.",
    );
  });

  it("requires the launch wallet to match the immutable publication creator", () => {
    const creator = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as const;
    expect(assertPublicationCreator(creator, `0x${creator.slice(2).toUpperCase()}`)).toBe(creator);
    expect(() =>
      assertPublicationCreator(creator, "0x3333333333333333333333333333333333333333"),
    ).toThrow("Reconnect the wallet that published this sound.");
  });
});
