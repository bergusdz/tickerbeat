import { describe, expect, it } from "vitest";

import {
  clipShouldTriggerAtStep,
  isSchedulableAudioTime,
  loopDurationSeconds,
  stepDurationMs,
} from "./tone-engine";

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

describe("sample clip transport", () => {
  it("starts the selected clip once at the beginning of every bar", () => {
    expect(clipShouldTriggerAtStep(0)).toBe(true);
    expect(clipShouldTriggerAtStep(1)).toBe(false);
    expect(clipShouldTriggerAtStep(15)).toBe(false);
  });

  it("caps clip playback to the one-bar duration", () => {
    expect(loopDurationSeconds(120)).toBe(2);
    expect(loopDurationSeconds(80)).toBe(3);
  });
});
