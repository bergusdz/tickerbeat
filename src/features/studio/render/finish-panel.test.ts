import { describe, expect, it } from "vitest";

import { symbolFromTitle } from "./finish-panel";

describe("symbolFromTitle", () => {
  it("creates a bounded Base token symbol", () => {
    expect(symbolFromTitle("Acid broadcast 001")).toBe("ACIDBROADC");
    expect(symbolFromTitle("♫♫♫")).toBe("BEAT");
  });
});
