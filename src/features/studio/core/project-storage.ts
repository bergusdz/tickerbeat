import {
  createDemoProject,
  type ClipReference,
  type Step,
  type StudioProject,
  type Track,
  type TrackId,
} from "./model";

export const PROJECT_STORAGE_KEY = "tickerbeat.project.v3";
export const VERSION_TWO_PROJECT_STORAGE_KEY = "tickerbeat.project.v2";
export const LEGACY_PROJECT_STORAGE_KEY = "tickerbeat.project.v1";

type LegacyTrack = Omit<Track, "instrument" | "filter" | "echo">;
type ProjectV2 = Omit<StudioProject, "version" | "clip">;
type ProjectV1 = Omit<ProjectV2, "tracks"> & { tracks: LegacyTrack[] };

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

function isLegacyTrack(value: unknown): value is LegacyTrack {
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

function isTrack(value: unknown): value is Track {
  if (!isLegacyTrack(value)) return false;
  const candidate = value as LegacyTrack & Record<string, unknown>;
  return (
    Number.isInteger(candidate.instrument) &&
    Number(candidate.instrument) >= 0 &&
    Number(candidate.instrument) <= 2 &&
    typeof candidate.filter === "number" &&
    candidate.filter >= 0 &&
    candidate.filter <= 1 &&
    typeof candidate.echo === "number" &&
    candidate.echo >= 0 &&
    candidate.echo <= 1
  );
}

function isClipReference(value: unknown): value is ClipReference {
  return (
    isRecord(value) &&
    typeof value.assetId === "string" &&
    value.assetId.length > 0 &&
    typeof value.sha256 === "string" &&
    /^[a-f0-9]{64}$/.test(value.sha256) &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    typeof value.mimeType === "string" &&
    value.mimeType.startsWith("audio/") &&
    Number.isInteger(value.size) &&
    Number(value.size) > 0 &&
    (value.source === "microphone" || value.source === "file") &&
    typeof value.level === "number" &&
    value.level >= 0 &&
    value.level <= 1 &&
    typeof value.trimStart === "number" &&
    value.trimStart >= 0 &&
    typeof value.trimEnd === "number" &&
    value.trimEnd >= 0 &&
    value.trimEnd <= 1 &&
    value.trimEnd >= value.trimStart
  );
}

function isProjectShape(
  value: unknown,
  trackGuard: (track: unknown) => boolean,
): value is ProjectV1 | ProjectV2 | StudioProject {
  if (!isRecord(value) || !Array.isArray(value.tracks) || value.tracks.length !== 4) return false;
  const ids = new Set(value.tracks.filter(trackGuard).map((track) => (track as LegacyTrack).id));
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
    value.tracks.every(trackGuard) &&
    ids.size === TRACK_IDS.size
  );
}

function migrateLegacyProject(project: ProjectV1): StudioProject {
  const defaults = new Map(createDemoProject().tracks.map((track) => [track.id, track]));
  return {
    version: 3,
    title: project.title,
    tempo: project.tempo,
    swing: project.swing,
    clip: null,
    tracks: project.tracks.map((track) => {
      const fallback = defaults.get(track.id)!;
      return {
        ...track,
        instrument: fallback.instrument,
        filter: fallback.filter,
        echo: fallback.echo,
      };
    }),
  };
}

function migrateVersionTwo(project: ProjectV2): StudioProject {
  return { ...project, version: 3, clip: null };
}

export function serializeProject(project: StudioProject): string {
  return JSON.stringify({ version: 3, project });
}

export function parseStoredProject(raw: string | null): StudioProject | null {
  if (!raw) return null;

  try {
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored)) return null;
    if (
      stored.version === 3 &&
      isProjectShape(stored.project, isTrack) &&
      (stored.project as Record<string, unknown>).version === 3 &&
      ((stored.project as Record<string, unknown>).clip === null ||
        isClipReference((stored.project as Record<string, unknown>).clip))
    ) {
      return stored.project as StudioProject;
    }
    if (stored.version === 2 && isProjectShape(stored.project, isTrack)) {
      return migrateVersionTwo(stored.project as ProjectV2);
    }
    if (stored.version === 1 && isProjectShape(stored.project, isLegacyTrack)) {
      return migrateLegacyProject(stored.project as ProjectV1);
    }
    return null;
  } catch {
    return null;
  }
}
