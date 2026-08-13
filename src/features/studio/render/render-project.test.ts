import { describe, expect, it } from "vitest";

import { createDemoProject } from "../core/model";
import { noteToFrequency, stepStartTimes } from "./render-project";

describe("noteToFrequency", () => {
  it("maps equal-tempered notes to hertz", () => {
    expect(noteToFrequency("A4")).toBeCloseTo(440, 5);
    expect(noteToFrequency("C4")).toBeCloseTo(261.626, 3);
    expect(noteToFrequency("Ab3")).toBeCloseTo(207.652, 3);
  });
});

describe("stepStartTimes", () => {
  it("preserves swung timing without changing bar length", () => {
    const project = { ...createDemoProject(), tempo: 120, swing: 0.2 };
    const starts = stepStartTimes(project);

    expect(starts).toHaveLength(16);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBeCloseTo(0.15, 5);
    expect(starts[2]).toBeCloseTo(0.25, 5);
  });
});
