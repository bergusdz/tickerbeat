import { describe, expect, it, vi } from "vitest";

import { createDemoProject } from "../core/model";
import { createSoundPlan } from "../core/sound-plan";
import { scheduleTonePlan, type ToneGraph } from "./tone-graph";

function scheduledGraph(): ToneGraph {
  const parameter = { value: 0, rampTo: vi.fn() };
  const disposable = { dispose: vi.fn() };
  return {
    drums: { triggerAttackRelease: vi.fn(), ...disposable } as never,
    bass: { triggerAttackRelease: vi.fn(), ...disposable } as never,
    chords: { triggerAttackRelease: vi.fn(), ...disposable } as never,
    lead: { triggerAttackRelease: vi.fn(), ...disposable } as never,
    volumes: Object.fromEntries(
      ["drums", "bass", "chords", "lead"].map((id) => [id, { volume: parameter, ...disposable }]),
    ) as never,
    filters: Object.fromEntries(
      ["drums", "bass", "chords", "lead"].map((id) => [id, { frequency: parameter, ...disposable }]),
    ) as never,
    sends: Object.fromEntries(
      ["drums", "bass", "chords", "lead"].map((id) => [id, { gain: parameter, ...disposable }]),
    ) as never,
    delay: disposable as never,
    limiter: disposable as never,
    clipGain: { gain: parameter, ...disposable } as never,
    clipPlayer: null,
    dispose: vi.fn(),
  };
}

describe("scheduleTonePlan", () => {
  it("uses the same resolved event timings for a selected live step and offline bar", () => {
    const plan = createSoundPlan(createDemoProject());
    const graph = scheduledGraph();

    scheduleTonePlan(graph, plan, 1, 0);

    expect(graph.drums.triggerAttackRelease).toHaveBeenCalledWith(
      "C1",
      expect.any(Number),
      1,
      1,
    );
    expect(graph.bass.triggerAttackRelease).toHaveBeenCalledWith(
      "F2",
      expect.any(Number),
      1,
      1,
    );
    expect(graph.chords.triggerAttackRelease).not.toHaveBeenCalled();
  });
});
