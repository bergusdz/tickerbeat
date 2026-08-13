import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoProject } from "../core/model";
import { FinishPanel } from "./finish-panel";
import { renderProjectToWav } from "./render-project";

vi.mock("./render-project", () => ({
  decodeAudioBlob: vi.fn(),
  renderProjectToWav: vi.fn(),
}));

vi.mock("../../release/release-shell", () => ({
  ReleaseShell: ({ artifact }: { artifact: { symbol: string } }) => (
    <div data-testid="publish-panel">{artifact.symbol}</div>
  ),
}));

describe("finished artifact invalidation", () => {
  beforeEach(() => {
    vi.mocked(renderProjectToWav).mockResolvedValue(new Blob(["wav"], { type: "audio/wav" }));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => `blob:${crypto.randomUUID()}`),
      revokeObjectURL: vi.fn(),
    });
  });

  it("removes the publish flow when the token ticker changes after rendering", async () => {
    render(<FinishPanel project={createDemoProject()} clip={null} onTitleChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "RENDER WAV + COVER" }));
    await screen.findByText("MASTER READY");

    fireEvent.change(screen.getByRole("textbox", { name: "Token ticker" }), {
      target: { value: "NEW" },
    });

    expect(screen.queryByText("MASTER READY")).not.toBeInTheDocument();
    expect(screen.queryByTestId("publish-panel")).not.toBeInTheDocument();
  });

  it("removes the publish flow when the underlying project changes", async () => {
    const project = createDemoProject();
    const view = render(<FinishPanel project={project} clip={null} onTitleChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "RENDER WAV + COVER" }));
    await screen.findByText("MASTER READY");

    view.rerender(
      <FinishPanel project={{ ...project, tempo: project.tempo + 1 }} clip={null} onTitleChange={vi.fn()} />,
    );

    await waitFor(() => expect(screen.queryByText("MASTER READY")).not.toBeInTheDocument());
    expect(screen.queryByTestId("publish-panel")).not.toBeInTheDocument();
  });
});
