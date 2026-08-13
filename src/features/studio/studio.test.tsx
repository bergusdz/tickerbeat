import { fireEvent, render, screen } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Studio } from "./studio";
import { createDemoProject } from "./core/model";
import { PROJECT_STORAGE_KEY, serializeProject } from "./core/project-storage";
import { createClipReference } from "./recording/clip-reference";
import { IndexedDbClipAssetStore } from "./recording/indexeddb-clip-store";

const audio = vi.hoisted(() => ({
  togglePlayback: vi.fn(),
}));

vi.mock("./use-studio-audio", () => ({
  useStudioAudio: () => ({
    isPlaying: false,
    currentStep: 0,
    togglePlayback: audio.togglePlayback,
  }),
}));

describe("Studio", () => {
  beforeEach(() => {
    audio.togglePlayback.mockClear();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:studio-test"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("indexedDB", new IDBFactory());
  });

  it("renders all four instrument tracks", () => {
    render(<Studio />);

    expect(screen.getByRole("button", { name: "Select Drums track" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Bass track" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Chords track" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Lead track" })).toBeInTheDocument();
  });

  it("toggles a sequencer step", () => {
    render(<Studio />);
    const step = screen.getByRole("button", { name: "Drums step 2" });

    expect(step).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(step);
    expect(step).toHaveAttribute("aria-pressed", "true");
  });

  it("adds and removes an accent on the selected channel", () => {
    render(<Studio />);
    const accent = screen.getByRole("button", { name: "Drums accent step 1" });

    expect(accent).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(accent);
    expect(accent).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(accent);
    expect(accent).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Drums accent step 2" })).toBeDisabled();
  });

  it("updates the tempo display", () => {
    render(<Studio />);

    fireEvent.change(screen.getByRole("slider", { name: "Tempo" }), {
      target: { value: "132" },
    });

    expect(screen.getByText("132", { selector: "output" })).toBeInTheDocument();
  });

  it("restores a valid local draft", async () => {
    localStorage.setItem(
      PROJECT_STORAGE_KEY,
      serializeProject({ ...createDemoProject(), tempo: 142, title: "Saved pulse" }),
    );

    render(<Studio />);

    expect(await screen.findByText("142", { selector: "output" })).toBeInTheDocument();
    expect(await screen.findByText("SAVED PULSE")).toBeInTheDocument();
  });

  it("restores a content-addressed clip with its draft", async () => {
    const blob = new NodeBlob(["sample"], { type: "audio/wav" }) as unknown as Blob;
    const clip = await createClipReference(blob, "restored.wav", "file");
    await new IndexedDbClipAssetStore(indexedDB).put(clip, blob);
    localStorage.setItem(
      PROJECT_STORAGE_KEY,
      serializeProject({ ...createDemoProject(), clip }),
    );

    render(<Studio />);

    expect(await screen.findByText("restored.wav")).toBeInTheDocument();
  });

  it("clears and restores the active track", () => {
    render(<Studio />);
    const firstStep = screen.getByRole("button", { name: "Drums step 1" });
    expect(firstStep).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Clear Drums" }));
    expect(firstStep).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Undo last edit" }));
    expect(firstStep).toHaveAttribute("aria-pressed", "true");
  });

  it("starts playback from the transport", () => {
    render(<Studio />);

    fireEvent.click(screen.getByRole("button", { name: "Play beat" }));
    expect(audio.togglePlayback).toHaveBeenCalledOnce();
  });

  it("shapes the selected channel without changing the others", () => {
    render(<Studio />);

    fireEvent.click(screen.getByRole("button", { name: "Select Bass track" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Bass instrument" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Bass filter" }), {
      target: { value: "82" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Bass echo" }), {
      target: { value: "36" },
    });

    expect(screen.getByRole("combobox", { name: "Bass instrument" })).toHaveValue("2");
    expect(screen.getByRole("slider", { name: "Bass filter" })).toHaveValue("82");
    expect(screen.getByRole("slider", { name: "Bass echo" })).toHaveValue("36");

    fireEvent.click(screen.getByRole("button", { name: "Select Drums track" }));
    expect(screen.getByRole("combobox", { name: "Drums instrument" })).toHaveValue("0");
  });

  it("trims and levels an imported sample clip", async () => {
    render(<Studio />);
    fireEvent.change(screen.getByLabelText("Import an audio clip"), {
      target: {
        files: [new File(["sample"], "signal.wav", { type: "audio/wav" })],
      },
    });

    expect(await screen.findByRole("button", { name: "Preview sample clip" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Clip start" })).toHaveValue("0");
    expect(screen.getByRole("slider", { name: "Clip end" })).toHaveValue("100");
    expect(screen.getByRole("slider", { name: "Clip level" })).toHaveValue("70");

    fireEvent.change(screen.getByRole("slider", { name: "Clip start" }), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Clip end" }), {
      target: { value: "75" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Clip level" }), {
      target: { value: "45" },
    });

    expect(screen.getByRole("slider", { name: "Clip start" })).toHaveValue("25");
    expect(screen.getByRole("slider", { name: "Clip end" })).toHaveValue("75");
    expect(screen.getByRole("slider", { name: "Clip level" })).toHaveValue("45");
  });
});
