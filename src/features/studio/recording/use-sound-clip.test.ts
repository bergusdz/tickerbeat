import { describe, expect, it } from "vitest";

import { validateClipFile } from "./use-sound-clip";

describe("validateClipFile", () => {
  it("accepts a short audio file and rejects unsafe inputs", () => {
    expect(validateClipFile(new File(["audio"], "voice.webm", { type: "audio/webm" }))).toBeNull();
    expect(validateClipFile(new File(["text"], "notes.txt", { type: "text/plain" }))).toMatch(/audio/i);
    expect(
      validateClipFile(new File([new Uint8Array(10_000_001)], "huge.wav", { type: "audio/wav" })),
    ).toMatch(/10 MB/i);
  });
});
