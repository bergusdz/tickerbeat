import { MUSICAL_KEY, RENDERER_VERSION } from "./provenance";

const DEFAULT_APP_URL = "https://tickerbeat.xyz";

export type PublicationMetadataInput = {
  title: string;
  symbol: string;
  description: string;
  tempo: number;
  creator: `0x${string}`;
  durationSeconds: number;
  audioSha256: string;
  projectSha256: string;
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
    creator: `0x${string}`;
    symbol: string;
    tempo: number;
    duration_seconds: number;
    musical_key: typeof MUSICAL_KEY;
    renderer_version: typeof RENDERER_VERSION;
    audio_mime_type: "audio/wav";
    audio_sha256: string;
    project_sha256: string;
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
  creator,
  durationSeconds,
  audioSha256,
  projectSha256,
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
      creator,
      symbol,
      tempo,
      duration_seconds: durationSeconds,
      musical_key: MUSICAL_KEY,
      renderer_version: RENDERER_VERSION,
      audio_mime_type: "audio/wav",
      audio_sha256: audioSha256,
      project_sha256: projectSha256,
      project_uri: ipfsUri(projectCid),
    },
  };
}
