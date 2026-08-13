export type PublishableArtifact = {
  title: string;
  symbol: string;
  tempo: number;
  audio: Blob;
  cover: Blob;
  project: Blob;
  audioUrl: string;
  coverUrl: string;
  projectUrl: string;
};

export type PublicationReceipt = {
  audioCid: string;
  coverCid: string;
  projectCid: string;
  metadataCid: string;
  audioUri: string;
  coverUri: string;
  projectUri: string;
  metadataUri: string;
  audioUrl: string;
  coverUrl: string;
  metadataUrl: string;
};
