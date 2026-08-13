import { describe, expect, it } from "vitest";

import { isSchedulableAudioTime, stepDurationMs } from "./tone-engine";

describe("isSchedulableAudioTime", () => {
  it("rejects non-finite transport callback times", () => {
    expect(isSchedulableAudioTime(Number.NaN)).toBe(false);
    expect(isSchedulableAudioTime(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isSchedulableAudioTime(0.25)).toBe(true);
  });
});

describe("stepDurationMs", () => {
  it("keeps each swung pair at the unswung total duration", () => {
    const straight = stepDurationMs(120, 0, 0);
    const long = stepDurationMs(120, 0.2, 0);
    const short = stepDurationMs(120, 0.2, 1);

    expect(straight).toBe(125);
    expect(long).toBe(150);
    expect(short).toBe(100);
    expect(long + short).toBe(straight * 2);
  });
});
