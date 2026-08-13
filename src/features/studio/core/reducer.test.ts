import { describe, expect, it } from "vitest";

import { createDemoProject } from "./model";
import { reduceProject } from "./reducer";

describe("reduceProject", () => {
  it("normalizes a project title", () => {
    const project = createDemoProject();
    const next = reduceProject(project, { type: "set-title", value: "  Night signal  " });

    expect(next.title).toBe("Night signal");
    expect(reduceProject(project, { type: "set-title", value: "   " })).toBe(project);
  });

  it("toggles one step without mutating the previous project", () => {
    const project = createDemoProject();
    const previous = project.tracks[1].steps[2].active;

    const next = reduceProject(project, {
      type: "toggle-step",
      trackId: "bass",
      step: 2,
    });

    expect(next.tracks[1].steps[2].active).toBe(!previous);
    expect(project.tracks[1].steps[2].active).toBe(previous);
  });

  it("toggles the accent of an active step without changing its gate", () => {
    const project = createDemoProject();
    const accented = reduceProject(project, {
      type: "toggle-accent",
      trackId: "bass",
      step: 3,
    });
    const restored = reduceProject(accented, {
      type: "toggle-accent",
      trackId: "bass",
      step: 3,
    });

    expect(project.tracks[1].steps[3]).toEqual({ active: true, velocity: 0.78 });
    expect(accented.tracks[1].steps[3]).toEqual({ active: true, velocity: 1 });
    expect(restored.tracks[1].steps[3]).toEqual({ active: true, velocity: 0.78 });
    expect(project.tracks[1].steps[3].velocity).toBe(0.78);
  });

  it("ignores accent edits for inactive or invalid steps", () => {
    const project = createDemoProject();

    expect(
      reduceProject(project, { type: "toggle-accent", trackId: "drums", step: 1 }),
    ).toBe(project);
    expect(
      reduceProject(project, { type: "toggle-accent", trackId: "drums", step: 16 }),
    ).toBe(project);
  });

  it("returns the same project for an invalid step index", () => {
    const project = createDemoProject();

    expect(
      reduceProject(project, { type: "toggle-step", trackId: "lead", step: 16 }),
    ).toBe(project);
  });

  it("clamps tempo, swing, and volume to safe ranges", () => {
    const project = createDemoProject();
    const fast = reduceProject(project, { type: "set-tempo", value: 999 });
    const unswung = reduceProject(fast, { type: "set-swing", value: -1 });
    const loud = reduceProject(unswung, {
      type: "set-volume",
      trackId: "lead",
      value: 20,
    });

    expect(fast.tempo).toBe(170);
    expect(unswung.swing).toBe(0);
    expect(loud.tracks[3].volume).toBe(6);
  });

  it("toggles mute and solo on only the selected track", () => {
    const project = createDemoProject();
    const muted = reduceProject(project, { type: "toggle-mute", trackId: "chords" });
    const soloed = reduceProject(muted, { type: "toggle-solo", trackId: "lead" });

    expect(muted.tracks.map((track) => track.muted)).toEqual([false, false, true, false]);
    expect(soloed.tracks.map((track) => track.solo)).toEqual([false, false, false, true]);
  });

  it("clears steps while preserving mixer settings", () => {
    const project = createDemoProject();
    project.tracks[0].volume = -9;
    project.tracks[0].muted = true;

    const next = reduceProject(project, { type: "clear-track", trackId: "drums" });

    expect(next.tracks[0].steps.every((step) => !step.active)).toBe(true);
    expect(next.tracks[0].volume).toBe(-9);
    expect(next.tracks[0].muted).toBe(true);
  });

  it("changes one channel instrument and clamps its FX controls", () => {
    const project = createDemoProject();
    const voiced = reduceProject(project, { type: "set-instrument", trackId: "bass", value: 2 });
    const filtered = reduceProject(voiced, { type: "set-filter", trackId: "bass", value: -1 });
    const echoed = reduceProject(filtered, { type: "set-echo", trackId: "bass", value: 4 });

    expect(voiced.tracks[1].instrument).toBe(2);
    expect(filtered.tracks[1].filter).toBe(0);
    expect(echoed.tracks[1].echo).toBe(1);
    expect(echoed.tracks[0]).toEqual(project.tracks[0]);
    expect(reduceProject(project, { type: "set-instrument", trackId: "bass", value: 7 })).toBe(project);
  });
});
