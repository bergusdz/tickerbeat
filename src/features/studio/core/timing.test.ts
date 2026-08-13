import { describe, expect, it } from "vitest";

import { loopDurationSeconds, stepDurationSeconds, stepStartTimes } from "./timing";

describe("studio timing", () => {
  it("keeps swung step pairs aligned to a one-bar loop", () => {
    const starts = stepStartTimes(120, 0.2);

    expect(starts).toHaveLength(16);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBeCloseTo(0.15, 5);
    expect(starts[2]).toBeCloseTo(0.25, 5);
    expect(stepDurationSeconds(120, 0.2, 0)).toBeCloseTo(0.15, 5);
    expect(loopDurationSeconds(120)).toBe(2);
  });
});
