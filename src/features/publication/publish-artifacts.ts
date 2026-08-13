import type { PinataSDK } from "pinata";

import { createPublicationMetadata, gatewayUrl, ipfsUri } from "./metadata";
import type { PublicationReceipt } from "./types";

type PublishInput = {
  title: string;
  symbol: string;
  tempo: number;
  audio: File;
  cover: File;
  project: File;
  appUrl: string;
};

export function normalizeGateway(gateway: string): string {
  const value = gateway.trim().replace(/\/$/, "");
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

export async function publishArtifacts(
  pinata: PinataSDK,
  gateway: string,
  input: PublishInput,
): Promise<PublicationReceipt> {
  const tags = { app: "tickerbeat", release: input.symbol };
  const [audio, cover, project] = await Promise.all([
    pinata.upload.public.file(input.audio).name(input.audio.name).keyvalues({ ...tags, kind: "audio" }),
    pinata.upload.public.file(input.cover).name(input.cover.name).keyvalues({ ...tags, kind: "cover" }),
    pinata.upload.public.file(input.project).name(input.project.name).keyvalues({ ...tags, kind: "project" }),
  ]);
  const metadata = createPublicationMetadata({
    title: input.title,
    symbol: input.symbol,
    description: `${input.title} is a playable TickerBeat release created in the browser and launched on Base.`,
    tempo: input.tempo,
    audioCid: audio.cid,
    coverCid: cover.cid,
    projectCid: project.cid,
    appUrl: input.appUrl,
  });
  const metadataUpload = await pinata.upload.public
    .json(metadata)
    .name(`${input.symbol.toLowerCase()}-metadata.json`)
    .keyvalues({ ...tags, kind: "metadata" });
  const publicGateway = normalizeGateway(gateway);

  return {
    audioCid: audio.cid,
    coverCid: cover.cid,
    projectCid: project.cid,
    metadataCid: metadataUpload.cid,
    audioUri: ipfsUri(audio.cid),
    coverUri: ipfsUri(cover.cid),
    projectUri: ipfsUri(project.cid),
    metadataUri: ipfsUri(metadataUpload.cid),
    audioUrl: gatewayUrl(publicGateway, audio.cid),
    coverUrl: gatewayUrl(publicGateway, cover.cid),
    metadataUrl: gatewayUrl(publicGateway, metadataUpload.cid),
  };
}
