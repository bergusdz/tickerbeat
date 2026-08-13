import { afterEach, describe, expect, it, vi } from "vitest";

import { getTickerBeatReleases } from "./clanker-api";

describe("Clanker board boundary", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns an empty board when the upstream token index times out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
      ),
    );

    const result = getTickerBeatReleases();
    await vi.advanceTimersByTimeAsync(8_000);

    await expect(result).resolves.toEqual([]);
  });
});

