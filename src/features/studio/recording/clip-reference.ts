import type { ClipReference } from "../core/model";
import { DEFAULT_CLIP_SETTINGS } from "./clip-playback";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Blob(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function createClipReference(
  blob: Blob,
  name: string,
  source: ClipReference["source"],
): Promise<ClipReference> {
  const sha256 = await sha256Blob(blob);
  return {
    assetId: sha256,
    sha256,
    name,
    mimeType: blob.type,
    size: blob.size,
    source,
    ...DEFAULT_CLIP_SETTINGS,
  };
}
