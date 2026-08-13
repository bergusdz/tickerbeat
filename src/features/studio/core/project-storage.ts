import type { Step, StudioProject, Track, TrackId } from "./model";

export const PROJECT_STORAGE_KEY = "tickerbeat.project.v1";

type StoredProject = {
  version: 1;
  project: StudioProject;
};

const TRACK_IDS = new Set<TrackId>(["drums", "bass", "chords", "lead"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStep(value: unknown): value is Step {
  return (
    isRecord(value) &&
    typeof value.active === "boolean" &&
    typeof value.velocity === "number" &&
    value.velocity >= 0 &&
    value.velocity <= 1
  );
}

function isTrack(value: unknown): value is Track {
  if (!isRecord(value) || !TRACK_IDS.has(value.id as TrackId)) return false;

  const validNote =
    typeof value.note === "string" ||
    (Array.isArray(value.note) && value.note.length > 0 && value.note.every((note) => typeof note === "string"));

  return (
    typeof value.label === "string" &&
    typeof value.color === "string" &&
    validNote &&
    typeof value.volume === "number" &&
    value.volume >= -36 &&
    value.volume <= 6 &&
    typeof value.muted === "boolean" &&
    typeof value.solo === "boolean" &&
    Array.isArray(value.steps) &&
    value.steps.length === 16 &&
    value.steps.every(isStep)
  );
}

function isStudioProject(value: unknown): value is StudioProject {
  if (!isRecord(value) || !Array.isArray(value.tracks) || value.tracks.length !== 4) return false;

  const ids = new Set(value.tracks.filter(isTrack).map((track) => track.id));
  return (
    typeof value.title === "string" &&
    value.title.length > 0 &&
    value.title.length <= 80 &&
    typeof value.tempo === "number" &&
    value.tempo >= 70 &&
    value.tempo <= 170 &&
    typeof value.swing === "number" &&
    value.swing >= 0 &&
    value.swing <= 0.45 &&
    value.tracks.every(isTrack) &&
    ids.size === TRACK_IDS.size
  );
}

export function serializeProject(project: StudioProject): string {
  const stored: StoredProject = { version: 1, project };
  return JSON.stringify(stored);
}

export function parseStoredProject(raw: string | null): StudioProject | null {
  if (!raw) return null;

  try {
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored) || stored.version !== 1 || !isStudioProject(stored.project)) return null;
    return stored.project;
  } catch {
    return null;
  }
}
