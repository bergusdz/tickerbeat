import { describe, expect, it } from "vitest";
import {
  encodeAbiParameters,
  encodeEventTopics,
  parseAbiParameters,
  type Log,
} from "viem";

import {
  assertClankerLaunchReceipt,
  CLANKER_TOKEN_CREATED_EVENT,
  CLANKER_V4_BASE_FACTORY,
} from "./launch-receipt";

const creator = "0x1111111111111111111111111111111111111111" as const;
const token = "0x2222222222222222222222222222222222222222" as const;
const other = "0x3333333333333333333333333333333333333333" as const;
const zeroAddress = "0x0000000000000000000000000000000000000000" as const;
const zeroHash = `0x${"00".repeat(32)}` as `0x${string}`;

function tokenCreatedLog({
  factory = CLANKER_V4_BASE_FACTORY,
  msgSender = creator,
  tokenAddress = token,
  tokenAdmin = creator,
}: {
  factory?: `0x${string}`;
  msgSender?: `0x${string}`;
  tokenAddress?: `0x${string}`;
  tokenAdmin?: `0x${string}`;
} = {}): Log {
  const topics = encodeEventTopics({
    abi: CLANKER_TOKEN_CREATED_EVENT,
    eventName: "TokenCreated",
    args: { tokenAddress, tokenAdmin },
  });
  const data = encodeAbiParameters(
    parseAbiParameters(
      "address, string, string, string, string, string, int24, address, bytes32, address, address, address, uint256, address[]",
    ),
    [
      msgSender,
      "ipfs://cover",
      "Beat",
      "BEAT",
      "metadata",
      "context",
      0,
      zeroAddress,
      zeroHash,
      zeroAddress,
      zeroAddress,
      zeroAddress,
      BigInt(0),
      [],
    ],
  );

  return {
    address: factory,
    blockHash: zeroHash,
    blockNumber: BigInt(1),
    data,
    logIndex: 0,
    removed: false,
    topics: topics as Log["topics"],
    transactionHash: zeroHash,
    transactionIndex: 0,
  };
}

describe("Clanker launch receipt validation", () => {
  it("accepts the reviewed token created by the reviewed wallet through the Base v4 factory", () => {
    expect(
      assertClankerLaunchReceipt({
        logs: [tokenCreatedLog()],
        expectedAddress: token,
        expectedCreator: creator,
      }),
    ).toBe(token);
  });

  it.each([
    ["factory", tokenCreatedLog({ factory: other })],
    ["token address", tokenCreatedLog({ tokenAddress: other })],
    ["transaction sender", tokenCreatedLog({ msgSender: other })],
    ["token admin", tokenCreatedLog({ tokenAdmin: other })],
  ])("rejects a receipt with the wrong %s", (_label, log) => {
    expect(() =>
      assertClankerLaunchReceipt({
        logs: [log],
        expectedAddress: token,
        expectedCreator: creator,
      }),
    ).toThrow("The confirmed Clanker launch does not match the reviewed token.");
  });
});
