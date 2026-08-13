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
    expect(parseStoredProject(JSON.stringify({ version: 3, project: createDemoProject() }))).toBeNull();
    expect(
      parseStoredProject(
        JSON.stringify({
          version: 1,
          project: { ...createDemoProject(), tempo: 900 },
        }),
      ),
    ).toBeNull();
  });

  it("migrates a version-1 draft with sound-design defaults", () => {
    const legacy = createDemoProject();
    const legacyTracks = legacy.tracks.map((track) => {
      const versionOneTrack: Record<string, unknown> = { ...track };
      delete versionOneTrack.instrument;
      delete versionOneTrack.filter;
      delete versionOneTrack.echo;
      return versionOneTrack;
    });
    const migrated = parseStoredProject(JSON.stringify({
      version: 1,
      project: { ...legacy, tempo: 126, tracks: legacyTracks },
    }));

    expect(migrated?.tempo).toBe(126);
    expect(migrated?.tracks.every((track) => typeof track.instrument === "number")).toBe(true);
    expect(migrated?.tracks.every((track) => typeof track.filter === "number")).toBe(true);
    expect(migrated?.tracks.every((track) => typeof track.echo === "number")).toBe(true);
  });
});
