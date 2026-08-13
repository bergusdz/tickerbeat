import { describe, expect, it } from "vitest";

import { createDemoProject } from "../core/model";
import { audioBufferToWav, createCoverSvg, projectDurationSeconds } from "./render-utils";

describe("projectDurationSeconds", () => {
  it("renders one complete bar regardless of swing", () => {
    expect(projectDurationSeconds({ ...createDemoProject(), tempo: 120, swing: 0 })).toBe(2);
    expect(projectDurationSeconds({ ...createDemoProject(), tempo: 120, swing: 0.4 })).toBe(2);
  });
});

describe("audioBufferToWav", () => {
  it("writes a stereo 16-bit PCM WAV header", () => {
    const channels = [new Float32Array([0, 0.5]), new Float32Array([0, -0.5])];
    const blob = audioBufferToWav({
      numberOfChannels: 2,
      length: 2,
      sampleRate: 44_100,
      getChannelData: (channel: number) => channels[channel],
    });

    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(44 + 2 * 2 * 2);
  });
});

describe("createCoverSvg", () => {
  it("is deterministic and escapes project titles", async () => {
    const project = { ...createDemoProject(), title: "Bass & <signal>" };
    const first = createCoverSvg(project);
    const second = createCoverSvg(project);

    expect(await first.text()).toBe(await second.text());
    expect(await first.text()).toContain("BASS &amp; &lt;SIGNAL&gt;");
  });
});
