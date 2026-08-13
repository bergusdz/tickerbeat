import { describe, expect, it } from "vitest";

import {
  cutoffFrequency,
  echoSendGain,
  instrumentLabel,
  oscillatorType,
} from "./sound-design";

describe("track sound design", () => {
  it("exposes three track-compatible instrument labels", () => {
    expect([0, 1, 2].map((preset) => instrumentLabel("drums", preset))).toEqual([
      "909 KICK",
      "SUB KICK",
      "TIGHT KICK",
    ]);
    expect([0, 1, 2].map((preset) => instrumentLabel("lead", preset))).toEqual([
      "SQUARE",
      "SAW",
      "SINE",
    ]);
  });

  it("maps presets to oscillator types and normalized FX to bounded audio values", () => {
    expect(oscillatorType("bass", 0)).toBe("sawtooth");
    expect(oscillatorType("chords", 2)).toBe("sine");
    expect(cutoffFrequency(-1)).toBe(180);
    expect(cutoffFrequency(0.5)).toBeGreaterThan(180);
    expect(cutoffFrequency(0.5)).toBeLessThan(12_000);
    expect(cutoffFrequency(2)).toBe(12_000);
    expect(echoSendGain(-1)).toBe(0);
    expect(echoSendGain(2)).toBe(0.45);
  });
});
