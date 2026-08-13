import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Studio } from "./studio";
import { createDemoProject } from "./core/model";
import { PROJECT_STORAGE_KEY, serializeProject } from "./core/project-storage";

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
  beforeEach(() => audio.togglePlayback.mockClear());

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
});
