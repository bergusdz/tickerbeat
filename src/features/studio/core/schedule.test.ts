import { describe, expect, it } from "vitest";

import { createDemoProject } from "./model";
import { eventsAtStep } from "./schedule";

describe("eventsAtStep", () => {
  it("returns only active and audible tracks", () => {
    const project = createDemoProject();
    project.tracks[1].muted = true;

    expect(eventsAtStep(project, 0).map((event) => event.trackId)).toEqual(["drums"]);
  });

  it("plays only solo tracks when any track is soloed", () => {
    const project = createDemoProject();
    project.tracks[1].solo = true;

    expect(eventsAtStep(project, 0).map((event) => event.trackId)).toEqual(["bass"]);
  });

  it("excludes inactive steps", () => {
    const project = createDemoProject();

    expect(eventsAtStep(project, 9)).toEqual([]);
  });

  it("wraps step indices modulo sixteen", () => {
    const project = createDemoProject();

    expect(eventsAtStep(project, 16)).toEqual(eventsAtStep(project, 0));
    expect(eventsAtStep(project, -1)).toEqual(eventsAtStep(project, 15));
  });
});
