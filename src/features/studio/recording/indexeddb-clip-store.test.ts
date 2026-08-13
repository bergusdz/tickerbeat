import { IDBFactory } from "fake-indexeddb";
import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClipReference } from "./clip-reference";
import { ClipAssetIntegrityError } from "./clip-asset-store";
import { IndexedDbClipAssetStore } from "./indexeddb-clip-store";

describe("IndexedDbClipAssetStore", () => {
  let store: IndexedDbClipAssetStore;

  beforeEach(() => {
    store = new IndexedDbClipAssetStore(new IDBFactory(), `tickerbeat-test-${crypto.randomUUID()}`);
  });

  it("round-trips a verified clip Blob", async () => {
    const blob = new NodeBlob(["beat"], { type: "audio/wav" }) as unknown as Blob;
    const reference = await createClipReference(blob, "beat.wav", "file");

    await store.put(reference, blob);

    expect(await (await store.get(reference))?.text()).toBe("beat");
  });

  it("returns null for a missing asset and removes stored assets", async () => {
    const blob = new NodeBlob(["beat"], { type: "audio/wav" }) as unknown as Blob;
    const reference = await createClipReference(blob, "beat.wav", "file");

    expect(await store.get(reference)).toBeNull();
    await store.put(reference, blob);
    await store.delete(reference.assetId);
    expect(await store.get(reference)).toBeNull();
  });

  it("rejects a Blob that does not match its content hash", async () => {
    const expected = new NodeBlob(["expected"], { type: "audio/wav" }) as unknown as Blob;
    const reference = await createClipReference(expected, "beat.wav", "file");

    const tampered = new NodeBlob(["tampered"], { type: "audio/wav" }) as unknown as Blob;
    await expect(store.put(reference, tampered)).rejects.toBeInstanceOf(ClipAssetIntegrityError);
  });

  it("can be constructed during server rendering without IndexedDB", () => {
    vi.stubGlobal("indexedDB", undefined);

    expect(() => new IndexedDbClipAssetStore()).not.toThrow();

    vi.unstubAllGlobals();
  });
});
