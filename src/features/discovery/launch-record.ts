export type LaunchRecord = {
  chainId: 8453;
  factory: `0x${string}`;
  token: `0x${string}`;
  creator: `0x${string}`;
  admin: `0x${string}`;
  metadataUri: string;
  transactionHash: `0x${string}`;
  blockNumber: string;
};

export type FactoryLaunchEvent = {
  tokenAddress: `0x${string}`;
  msgSender: `0x${string}`;
  tokenAdmin: `0x${string}`;
  tokenContext: string;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};
