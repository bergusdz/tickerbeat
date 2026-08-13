import { isAddressEqual, parseAbi, parseEventLogs, type Log } from "viem";

// Base deployment pinned by clanker-sdk@4.2.18.
export const CLANKER_V4_BASE_FACTORY = "0xE85A59c628F7d27878ACeB4bf3b35733630083a9" as const;

export const CLANKER_TOKEN_CREATED_EVENT = parseAbi([
  "event TokenCreated(address msgSender, address indexed tokenAddress, address indexed tokenAdmin, string tokenImage, string tokenName, string tokenSymbol, string tokenMetadata, string tokenContext, int24 startingTick, address poolHook, bytes32 poolId, address pairedToken, address locker, address mevModule, uint256 extensionsSupply, address[] extensions)",
]);

export function assertClankerLaunchReceipt({
  logs,
  expectedAddress,
  expectedCreator,
}: {
  logs: readonly Log[];
  expectedAddress: `0x${string}`;
  expectedCreator: `0x${string}`;
}): `0x${string}` {
  const factoryLogs = logs.filter((log) =>
    isAddressEqual(log.address, CLANKER_V4_BASE_FACTORY),
  );
  const events = parseEventLogs({
    abi: CLANKER_TOKEN_CREATED_EVENT,
    eventName: "TokenCreated",
    logs: factoryLogs,
    strict: true,
  });
  const confirmed = events.find(
    ({ args }) =>
      isAddressEqual(args.tokenAddress, expectedAddress) &&
      isAddressEqual(args.msgSender, expectedCreator) &&
      isAddressEqual(args.tokenAdmin, expectedCreator),
  );

  if (!confirmed) {
    throw new Error("The confirmed Clanker launch does not match the reviewed token.");
  }

  return confirmed.args.tokenAddress;
}
