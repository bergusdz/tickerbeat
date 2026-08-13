import { describe, expect, it } from "vitest";

import { createDemoProject } from "./model";
import { createSoundPlan } from "./sound-plan";

describe("createSoundPlan", () => {
  it("resolves one deterministic bar from project state", () => {
    const plan = createSoundPlan(createDemoProject());

    expect(plan.durationSeconds).toBeCloseTo((60 / 118) * 4);
    expect(plan.events.filter((event) => event.trackId === "drums")).toHaveLength(4);
    expect(plan.events[0]).toMatchObject({ step: 0, startSeconds: 0 });
    expect(plan.tracks.drums).toMatchObject({ volumeDb: -4, instrument: 0 });
  });

  it("resolves the referenced clip window without browser audio types", () => {
    const project = {
      ...createDemoProject(),
      clip: {
        assetId: "a".repeat(64),
        sha256: "a".repeat(64),
        name: "signal.wav",
        mimeType: "audio/wav",
        size: 12,
        source: "file" as const,
        level: 0.5,
        trimStart: 0.25,
        trimEnd: 0.75,
      },
    };

    const plan = createSoundPlan(project, { durationSeconds: 8 });

    expect(plan.clip).toEqual({
      assetId: "a".repeat(64),
      startSeconds: 0,
      offsetSeconds: 2,
      durationSeconds: expect.any(Number),
      gain: 0.5,
    });
    expect(plan.clip?.durationSeconds).toBeCloseTo(plan.durationSeconds);
  });
});
