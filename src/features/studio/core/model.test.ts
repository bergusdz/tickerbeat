import { describe, expect, it } from "vitest";

import { createDemoProject } from "./model";

describe("createDemoProject", () => {
  it("creates a fresh four-track, sixteen-step groove", () => {
    const first = createDemoProject();
    const second = createDemoProject();

    expect(first.tempo).toBe(118);
    expect(first.swing).toBe(0.12);
    expect(first.tracks.map((track) => track.id)).toEqual([
      "drums",
      "bass",
      "chords",
      "lead",
    ]);
    expect(first.tracks.every((track) => track.steps.length === 16)).toBe(true);
    expect(first.tracks.every((track) => [0, 1, 2].includes(track.instrument))).toBe(true);
    expect(first.tracks.every((track) => track.filter >= 0 && track.filter <= 1)).toBe(true);
    expect(first.tracks.every((track) => track.echo >= 0 && track.echo <= 1)).toBe(true);

    first.tracks[0].steps[0].active = false;
    expect(second.tracks[0].steps[0].active).toBe(true);
  });
});
