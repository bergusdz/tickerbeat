export type BoardRelease = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  imageUrl: string | null;
  audioUrl: string | null;
  metadataUrl: string | null;
  deployedAt: string | null;
  creator: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: string;
};

export type ClankerApiToken = {
  admin?: string;
  msg_sender?: string;
  tx_hash?: string;
  factory_address?: string;
  contract_address?: string;
  name?: string;
  symbol?: string;
  image?: string;
  img_url?: string;
  metadata?: {
    description?: string;
    socialMediaUrls?: Array<{ platform?: string; url?: string }>;
  };
  social_context?: { interface?: string; platform?: string; id?: string };
  deployed_at?: string;
};
