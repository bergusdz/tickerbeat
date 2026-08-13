import { describe, expect, it } from "vitest";

import { commit, createHistory, redo, undo } from "./history";
import { createDemoProject } from "./model";

describe("project history", () => {
  it("commits, undoes, and redoes an edit", () => {
    const initial = createDemoProject();
    const committed = commit(createHistory(initial), {
      type: "toggle-step",
      trackId: "bass",
      step: 2,
    });

    expect(committed.past).toHaveLength(1);
    expect(committed.present).not.toEqual(initial);

    const undone = undo(committed);
    expect(undone.present).toEqual(initial);
    expect(undone.future).toHaveLength(1);

    const redone = redo(undone);
    expect(redone.present).toEqual(committed.present);
    expect(redone.future).toHaveLength(0);
  });

  it("clears redo history after a new edit", () => {
    const initial = createDemoProject();
    const changed = commit(createHistory(initial), {
      type: "toggle-step",
      trackId: "lead",
      step: 2,
    });
    const undone = undo(changed);
    const replacement = commit(undone, { type: "set-tempo", value: 126 });

    expect(replacement.future).toHaveLength(0);
    expect(replacement.present.tempo).toBe(126);
  });

  it("does not create history for a no-op action", () => {
    const history = createHistory(createDemoProject());
    const next = commit(history, { type: "set-tempo", value: 118 });

    expect(next).toBe(history);
  });
});
