import { formatEther, isAddressEqual } from "viem";

export function createLaunchReview({
  creator,
  expectedAddress,
  metadataUri,
  valueWei,
}: {
  creator: `0x${string}`;
  expectedAddress: `0x${string}`;
  metadataUri: string;
  valueWei: bigint;
}) {
  return {
    protocol: "Clanker v4" as const,
    network: "Base" as const,
    chainId: 8453 as const,
    creator,
    expectedAddress,
    metadataUri,
    valueEth: `${formatEther(valueWei)} ETH`,
  };
}

export function assertReviewedLaunch(
  reviewedConfig: string,
  currentConfig: string,
  expectedAddress: `0x${string}`,
): `0x${string}` {
  if (reviewedConfig !== currentConfig) {
    throw new Error("Launch details changed. Check the launch again.");
  }
  return expectedAddress;
}

export function assertPublicationCreator(
  publishedCreator: `0x${string}`,
  connectedCreator: `0x${string}`,
): `0x${string}` {
  if (!isAddressEqual(publishedCreator, connectedCreator)) {
    throw new Error("Reconnect the wallet that published this sound.");
  }
  return publishedCreator;
}
