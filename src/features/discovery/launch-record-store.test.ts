import { beforeEach, describe, expect, it } from "vitest";

import type { LaunchRecord } from "./launch-record";
import { loadLaunchRecords, saveLaunchRecord } from "./launch-record-store";

const record: LaunchRecord = {
  chainId: 8453,
  factory: "0xE85A59c628F7d27878ACeB4bf3b35733630083a9",
  token: "0x1111111111111111111111111111111111111111",
  creator: "0x2222222222222222222222222222222222222222",
  admin: "0x2222222222222222222222222222222222222222",
  metadataUri: "ipfs://metadata",
  transactionHash: `0x${"3".repeat(64)}`,
  blockNumber: "100",
};

describe("launch record storage", () => {
  beforeEach(() => localStorage.clear());

  it("persists confirmed records once by token address", () => {
    saveLaunchRecord(record);
    saveLaunchRecord(record);

    expect(loadLaunchRecords()).toEqual([record]);
  });

  it("fails closed on malformed local data", () => {
    localStorage.setItem("tickerbeat.launch-records.v1", "not-json");
    expect(loadLaunchRecords()).toEqual([]);
  });
});
