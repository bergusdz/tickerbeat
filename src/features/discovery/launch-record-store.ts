import { isAddress } from "viem";

import type { LaunchRecord } from "./launch-record";

export const LAUNCH_RECORDS_KEY = "tickerbeat.launch-records.v1";

function isLaunchRecord(value: unknown): value is LaunchRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.chainId === 8453 &&
    typeof record.factory === "string" && isAddress(record.factory) &&
    typeof record.token === "string" && isAddress(record.token) &&
    typeof record.creator === "string" && isAddress(record.creator) &&
    typeof record.admin === "string" && isAddress(record.admin) &&
    typeof record.metadataUri === "string" && record.metadataUri.startsWith("ipfs://") &&
    typeof record.transactionHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(record.transactionHash) &&
    typeof record.blockNumber === "string" && /^\d+$/.test(record.blockNumber)
  );
}

export function loadLaunchRecords(storage: Storage = localStorage): LaunchRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(LAUNCH_RECORDS_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isLaunchRecord) : [];
  } catch {
    return [];
  }
}

export function saveLaunchRecord(record: LaunchRecord, storage: Storage = localStorage): void {
  const records = loadLaunchRecords(storage);
  const withoutToken = records.filter(
    (candidate) => candidate.token.toLowerCase() !== record.token.toLowerCase(),
  );
  storage.setItem(LAUNCH_RECORDS_KEY, JSON.stringify([record, ...withoutToken]));
}
