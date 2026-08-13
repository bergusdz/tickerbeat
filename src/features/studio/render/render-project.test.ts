import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoProject } from "../core/model";
import { createSoundPlan } from "../core/sound-plan";
import { createToneGraph, scheduleTonePlan } from "../audio/tone-graph";
import { renderProjectToWav } from "./render-project";

const mocks = vi.hoisted(() => ({
  offline: vi.fn(),
  graph: { dispose: vi.fn() },
}));

vi.mock("tone", () => ({ Offline: mocks.offline }));
vi.mock("../audio/tone-graph", () => ({
  createToneGraph: vi.fn(() => mocks.graph),
  scheduleTonePlan: vi.fn(),
}));

describe("renderProjectToWav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.offline.mockImplementation(async (callback: () => void) => {
      callback();
      return {
        numberOfChannels: 2,
        length: 2,
        sampleRate: 44_100,
        getChannelData: () => new Float32Array(2),
      };
    });
  });

  it("renders the canonical SoundPlan through Tone.Offline", async () => {
    const project = createDemoProject();
    const plan = createSoundPlan(project);

    const wav = await renderProjectToWav(project);

    expect(mocks.offline).toHaveBeenCalledWith(expect.any(Function), plan.durationSeconds, 2, 44_100);
    expect(createToneGraph).toHaveBeenCalledWith(expect.any(Object), plan);
    expect(scheduleTonePlan).toHaveBeenCalledWith(mocks.graph, plan);
    expect(mocks.graph.dispose).toHaveBeenCalledOnce();
    expect(wav.type).toBe("audio/wav");
  });
});
