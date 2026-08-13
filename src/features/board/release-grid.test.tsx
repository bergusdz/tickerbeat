import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BoardRelease } from "./types";
import { ReleaseGrid } from "./release-grid";

const releases: BoardRelease[] = [
  {
    address: "0x1111111111111111111111111111111111111111",
    name: "Signal One",
    symbol: "ONE",
    imageUrl: null,
    audioUrl: "ipfs://audio-one",
    metadataUrl: "ipfs://metadata-one",
    deployedAt: "2026-08-13T00:00:00.000Z",
  },
  {
    address: "0x2222222222222222222222222222222222222222",
    name: "Signal Two",
    symbol: "TWO",
    imageUrl: null,
    audioUrl: "ipfs://audio-two",
    metadataUrl: "ipfs://metadata-two",
    deployedAt: "2026-08-13T01:00:00.000Z",
  },
];

describe("ReleaseGrid", () => {
  it("keeps previews lazy and pauses the previous sound when another starts", () => {
    render(<ReleaseGrid items={releases} />);
    const first = screen.getByLabelText("Play Signal One preview") as HTMLAudioElement;
    const second = screen.getByLabelText("Play Signal Two preview") as HTMLAudioElement;
    const pauseFirst = vi.spyOn(first, "pause").mockImplementation(() => undefined);
    const pauseSecond = vi.spyOn(second, "pause").mockImplementation(() => undefined);

    expect(first).toHaveAttribute("preload", "none");
    expect(second).toHaveAttribute("preload", "none");

    fireEvent.play(first);
    expect(pauseSecond).toHaveBeenCalledOnce();
    expect(first.closest("article")).toHaveAttribute("data-playing", "true");

    fireEvent.play(second);
    expect(pauseFirst).toHaveBeenCalledOnce();
    expect(first.closest("article")).toHaveAttribute("data-playing", "false");
    expect(second.closest("article")).toHaveAttribute("data-playing", "true");
  });
});
