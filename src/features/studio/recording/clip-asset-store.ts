import type { ClipReference } from "../core/model";

export class ClipAssetIntegrityError extends Error {
  constructor(assetId: string) {
    super(`Clip asset ${assetId} does not match its content hash.`);
    this.name = "ClipAssetIntegrityError";
  }
}

export interface ClipAssetStore {
  put(reference: ClipReference, blob: Blob): Promise<void>;
  get(reference: ClipReference): Promise<Blob | null>;
  delete(assetId: string): Promise<void>;
}
