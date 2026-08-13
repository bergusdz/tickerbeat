import { describe, expect, it } from "vitest";

import { createDemoProject } from "./model";
import { parseStoredProject, serializeProject } from "./project-storage";

describe("project storage", () => {
  it("round-trips a versioned project", () => {
    const project = createDemoProject();

    expect(parseStoredProject(serializeProject(project))).toEqual(project);
  });

  it("rejects malformed, unknown-version, and structurally invalid drafts", () => {
    expect(parseStoredProject("not json")).toBeNull();
    expect(parseStoredProject(JSON.stringify({ version: 2, project: createDemoProject() }))).toBeNull();
    expect(
      parseStoredProject(
        JSON.stringify({
          version: 1,
          project: { ...createDemoProject(), tempo: 900 },
        }),
      ),
    ).toBeNull();
  });
});
