import { describe, expect, it } from "vitest";

import { assertReviewedLaunch } from "./launch-review";

const expectedAddress = "0x1111111111111111111111111111111111111111" as const;

describe("launch review binding", () => {
  it("returns the reviewed address when the launch details are unchanged", () => {
    expect(assertReviewedLaunch("config-a", "config-a", expectedAddress)).toBe(expectedAddress);
  });

  it("rejects deployment when launch details changed after simulation", () => {
    expect(() => assertReviewedLaunch("config-a", "config-b", expectedAddress)).toThrow(
      "Launch details changed. Check the launch again.",
    );
  });
});
