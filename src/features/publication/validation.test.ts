import { describe, expect, it } from "vitest";

import { validatePublicationFiles } from "./validation";

function file(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("publication validation", () => {
  it("accepts TickerBeat master artifacts", () => {
    expect(
      validatePublicationFiles({
        audio: file("loop.wav", "audio/wav", 256),
        cover: file("cover.svg", "image/svg+xml", 256),
        project: file("loop.tickerbeat.json", "application/json", 256),
      }),
    ).toEqual([]);
  });

  it("rejects incorrect types and oversized artifacts", () => {
    const errors = validatePublicationFiles({
      audio: file("loop.mp3", "audio/mpeg", 16 * 1024 * 1024),
      cover: file("cover.png", "image/png", 2 * 1024 * 1024),
      project: file("loop.txt", "text/plain", 2 * 1024 * 1024),
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "Audio must be a WAV file.",
        "Audio must be 15 MB or smaller.",
        "Cover must be an SVG file.",
        "Cover must be 1 MB or smaller.",
        "Project must be JSON.",
        "Project must be 1 MB or smaller.",
      ]),
    );
  });
});
