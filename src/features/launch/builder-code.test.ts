import { describe, expect, it } from "vitest";

import { builderCodeDataSuffix } from "./builder-code";

describe("Base Builder Code attribution", () => {
  it("converts the code copied from base.dev into an ERC-8021 suffix", () => {
    const suffix = builderCodeDataSuffix("bc_tickerbeat");

    expect(suffix).toBeDefined();
    expect(suffix).toMatch(/^0x[0-9a-f]+$/);
    expect(suffix?.endsWith("80218021802180218021802180218021")).toBe(true);
  });

  it("omits attribution when no Builder Code is configured", () => {
    expect(builderCodeDataSuffix(undefined)).toBeUndefined();
    expect(builderCodeDataSuffix("  ")).toBeUndefined();
  });

  it("rejects a malformed Builder Code instead of silently misattributing a launch", () => {
    expect(() => builderCodeDataSuffix("tickerbeat")).toThrow("Base Builder Code");
  });
});
