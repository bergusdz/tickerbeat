import { formatEther } from "viem";

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
