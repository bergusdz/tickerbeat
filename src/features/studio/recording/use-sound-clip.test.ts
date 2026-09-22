import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ClipReference } from "../core/model";
import type { ClipAssetStore } from "./clip-asset-store";
import { useSoundClip, validateClipFile } from "./use-sound-clip";

const reference: ClipReference = {
  assetId: "asset-1",
  sha256: "hash-1",
  name: "beat.wav",
  mimeType: "audio/wav",
  size: 4,
  source: "file",
  level: 1,
  trimStart: 0,
  trimEnd: 1,
};

describe("useSoundClip", () => {
  it("deletes the persisted asset when the loaded clip is cleared", async () => {
    const store: ClipAssetStore = {
      put: vi.fn(),
      get: vi.fn().mockResolvedValue(new Blob(["beat"], { type: "audio/wav" })),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const onReferenceChange = vi.fn();
    const { result } = renderHook(() => useSoundClip(reference, onReferenceChange, store));

    await waitFor(() => expect(result.current.clip?.assetId).toBe(reference.assetId));
    result.current.clearClip();

    expect(store.delete).toHaveBeenCalledWith(reference.assetId);
    expect(onReferenceChange).toHaveBeenLastCalledWith(null);
  });
});

describe("validateClipFile", () => {
  it("accepts a short audio file and rejects unsafe inputs", () => {
    expect(validateClipFile(new File(["audio"], "voice.webm", { type: "audio/webm" }))).toBeNull();
    expect(validateClipFile(new File(["text"], "notes.txt", { type: "text/plain" }))).toMatch(/audio/i);
    expect(
      validateClipFile(new File([new Uint8Array(10_000_001)], "huge.wav", { type: "audio/wav" })),
    ).toMatch(/10 MB/i);
  });
});
