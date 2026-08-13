import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Workspace } from "./workspace";

const panels = {
  make: <p>Sequencer surface</p>,
  mix: <p>Mixer surface</p>,
  finish: <p>Release surface</p>,
  board: <p>Discovery surface</p>,
};

describe("Workspace", () => {
  it("opens on Make and exposes an accessible four-stage workflow", () => {
    render(<Workspace panels={panels} />);

    expect(screen.getByRole("tab", { name: /make/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: /make/i })).toBeVisible();
    expect(document.getElementById("workspace-panel-mix")).not.toBeVisible();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });

  it("changes stages without unmounting their contents", () => {
    render(<Workspace panels={panels} />);

    const mixContent = screen.getByText("Mixer surface");
    fireEvent.click(screen.getByRole("tab", { name: /mix/i }));

    expect(screen.getByRole("tab", { name: /mix/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: /mix/i })).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /make/i }));
    expect(screen.getByText("Mixer surface")).toBe(mixContent);
  });

  it("supports arrow, home and end navigation", () => {
    render(<Workspace panels={panels} />);

    const make = screen.getByRole("tab", { name: /make/i });
    make.focus();
    fireEvent.keyDown(make, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /mix/i })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("tab", { name: /mix/i }), { key: "End" });
    expect(screen.getByRole("tab", { name: /board/i })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("tab", { name: /board/i }), { key: "Home" });
    expect(make).toHaveFocus();
  });
});
