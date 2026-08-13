import { isAddress, isAddressEqual } from "viem";

import type { ClankerApiToken } from "../board/types";
import { CLANKER_V4_BASE_FACTORY } from "../launch/launch-receipt";
import type { FactoryLaunchEvent, LaunchRecord } from "./launch-record";

function address(value: string | undefined): `0x${string}` | null {
  return value && isAddress(value) ? value : null;
}

function transactionHash(value: string | undefined): `0x${string}` | null {
  return value && /^0x[0-9a-fA-F]{64}$/.test(value) ? (value as `0x${string}`) : null;
}

export function reconcileLaunchRecord(
  candidate: ClankerApiToken,
  event: FactoryLaunchEvent,
): LaunchRecord {
  const token = address(candidate.contract_address);
  const admin = address(candidate.admin);
  const creator = address(candidate.msg_sender);
  const factory = address(candidate.factory_address);
  const txHash = transactionHash(candidate.tx_hash);
  const metadataUri = candidate.social_context?.id;
  const isTickerBeatContext =
    candidate.social_context?.interface === "TickerBeat" &&
    candidate.social_context.platform === "TickerBeat" &&
    typeof metadataUri === "string" &&
    event.tokenContext.includes("TickerBeat") &&
    event.tokenContext.includes(metadataUri);

  if (
    !token ||
    !admin ||
    !creator ||
    !factory ||
    !txHash ||
    !isTickerBeatContext ||
    !isAddressEqual(factory, CLANKER_V4_BASE_FACTORY) ||
    !isAddressEqual(token, event.tokenAddress) ||
    !isAddressEqual(creator, event.msgSender) ||
    !isAddressEqual(admin, event.tokenAdmin) ||
    txHash.toLowerCase() !== event.transactionHash.toLowerCase()
  ) {
    throw new Error("The Clanker API candidate does not match its Base factory event.");
  }

  return {
    chainId: 8453,
    factory,
    token,
    creator,
    admin,
    metadataUri,
    transactionHash: txHash,
    blockNumber: String(event.blockNumber),
  };
}
