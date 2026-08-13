// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { IndexedDbClipAssetStore } from "./indexeddb-clip-store";

vi.stubGlobal("localStorage", { clear: () => undefined });

describe("IndexedDbClipAssetStore server boundary", () => {
  it("constructs without touching a browser global", () => {
    expect(() => new IndexedDbClipAssetStore()).not.toThrow();
  });
});
