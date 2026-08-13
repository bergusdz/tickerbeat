import { describe, expect, it } from "vitest";

import { sha256Hex } from "./provenance";

describe("publication provenance", () => {
  it("hashes identical artifacts deterministically", async () => {
    const first = new Blob(["tickerbeat"], { type: "text/plain" });
    const second = new Blob(["tickerbeat"], { type: "text/plain" });

    expect(await sha256Hex(first)).toBe(
      "3af868f278725f659db738ee28bd9e0aff25d8f388564b3df2e1f8642eee8cb5",
    );
    expect(await sha256Hex(second)).toBe(await sha256Hex(first));
  });
});
