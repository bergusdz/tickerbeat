const DEFAULT_APP_URL = "https://tickerbeat.xyz";

export type PublicationMetadataInput = {
  title: string;
  symbol: string;
  description: string;
  tempo: number;
  audioCid: string;
  coverCid: string;
  projectCid: string;
  appUrl?: string;
};

export type PublicationMetadata = {
  name: string;
  description: string;
  image: string;
  animation_url: string;
  external_url: string;
  properties: {
    app: "TickerBeat";
    chain: "Base";
    symbol: string;
    tempo: number;
    project_uri: string;
  };
};

export function ipfsUri(cid: string): string {
  return `ipfs://${cid}`;
}

export function gatewayUrl(gateway: string, cid: string): string {
  return `${gateway.replace(/\/$/, "")}/ipfs/${cid}`;
}

export function createPublicationMetadata({
  title,
  symbol,
  description,
  tempo,
  audioCid,
  coverCid,
  projectCid,
  appUrl = DEFAULT_APP_URL,
}: PublicationMetadataInput): PublicationMetadata {
  return {
    name: title,
    description,
    image: ipfsUri(coverCid),
    animation_url: ipfsUri(audioCid),
    external_url: appUrl,
    properties: {
      app: "TickerBeat",
      chain: "Base",
      symbol,
      tempo,
      project_uri: ipfsUri(projectCid),
    },
  };
}
