import {
  isAddressEqual,
  parseEventLogs,
  type Log,
} from "viem";

import {
  CLANKER_TOKEN_CREATED_EVENT,
  CLANKER_V4_BASE_FACTORY,
} from "../launch/launch-receipt";
import type { FactoryLaunchEvent } from "./launch-record";

export function factoryEventForToken(
  logs: readonly Log[],
  tokenAddress: `0x${string}`,
): FactoryLaunchEvent | null {
  const events = parseEventLogs({
    abi: CLANKER_TOKEN_CREATED_EVENT,
    eventName: "TokenCreated",
    logs: logs.filter((log) => isAddressEqual(log.address, CLANKER_V4_BASE_FACTORY)),
    strict: true,
  });
  const event = events.find(({ args }) => isAddressEqual(args.tokenAddress, tokenAddress));
  if (!event || !event.transactionHash || event.blockNumber === null) return null;

  return {
    tokenAddress: event.args.tokenAddress,
    msgSender: event.args.msgSender,
    tokenAdmin: event.args.tokenAdmin,
    tokenContext: event.args.tokenContext,
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
  };
}
