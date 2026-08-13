import type { StudioProject } from "./model";
import { reduceProject, type ProjectAction } from "./reducer";

export type ProjectHistory = {
  past: StudioProject[];
  present: StudioProject;
  future: StudioProject[];
};

const HISTORY_LIMIT = 50;

export function createHistory(project: StudioProject): ProjectHistory {
  return { past: [], present: project, future: [] };
}

export function commit(history: ProjectHistory, action: ProjectAction): ProjectHistory {
  const present = reduceProject(history.present, action);
  if (present === history.present) return history;

  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present,
    future: [],
  };
}

export function undo(history: ProjectHistory): ProjectHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: ProjectHistory): ProjectHistory {
  const next = history.future[0];
  if (!next) return history;

  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: history.future.slice(1),
  };
}
