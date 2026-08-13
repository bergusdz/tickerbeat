import { describe, expect, it } from "vitest";

import { createClipReference, sha256Blob } from "./clip-reference";

describe("clip references", () => {
  it("creates a content-addressed reference with safe playback defaults", async () => {
    const blob = new Blob(["beat"], { type: "audio/wav" });

    const reference = await createClipReference(blob, "beat.wav", "file");

    expect(reference).toEqual({
      assetId: reference.sha256,
      sha256: await sha256Blob(blob),
      name: "beat.wav",
      mimeType: "audio/wav",
      size: 4,
      source: "file",
      trimStart: 0,
      trimEnd: 1,
      level: 0.7,
    });
    expect(reference.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
