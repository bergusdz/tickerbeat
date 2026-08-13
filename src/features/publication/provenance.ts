import { createHash } from "node:crypto";

export const RENDERER_VERSION = "tickerbeat-web-audio-v1" as const;
export const MUSICAL_KEY = "F minor" as const;

export async function sha256Hex(value: Blob): Promise<string> {
  return createHash("sha256")
    .update(new Uint8Array(await value.arrayBuffer()))
    .digest("hex");
}
