import { describe, expect, it } from "vitest";

import {
  clipPlaybackWindow,
  normalizeClipSettings,
  updateClipSettings,
} from "./clip-playback";

describe("clip playback settings", () => {
  it("converts normalized trim into a bounded playback window", () => {
    expect(
      clipPlaybackWindow(
        10,
        { trimStart: 0.2, trimEnd: 0.8, level: 0.5 },
        4,
      ),
    ).toEqual({ offset: 2, duration: 4, gain: 0.5 });
  });

  it("keeps trim and level settings inside safe bounds", () => {
    expect(normalizeClipSettings({ trimStart: -1, trimEnd: 3, level: 2 })).toEqual({
      trimStart: 0,
      trimEnd: 1,
      level: 1,
    });

    expect(
      updateClipSettings(
        { trimStart: 0.1, trimEnd: 0.9, level: 0.7 },
        { trimStart: 0.95 },
      ),
    ).toEqual({ trimStart: 0.89, trimEnd: 0.9, level: 0.7 });
  });

  it("returns no window for unusable source or loop durations", () => {
    const settings = { trimStart: 0, trimEnd: 1, level: 0.7 };
    expect(clipPlaybackWindow(0, settings, 4)).toBeNull();
    expect(clipPlaybackWindow(4, settings, 0)).toBeNull();
  });
});
