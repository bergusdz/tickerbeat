import type { StudioProject, Track, TrackId } from "./model";

export type ProjectAction =
  | { type: "toggle-step"; trackId: TrackId; step: number }
  | { type: "set-tempo"; value: number }
  | { type: "set-swing"; value: number }
  | { type: "set-volume"; trackId: TrackId; value: number }
  | { type: "toggle-mute"; trackId: TrackId }
  | { type: "toggle-solo"; trackId: TrackId }
  | { type: "clear-track"; trackId: TrackId };

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function updateTrack(
  project: StudioProject,
  trackId: TrackId,
  update: (track: Track) => Track,
): StudioProject {
  let changed = false;
  const tracks = project.tracks.map((track) => {
    if (track.id !== trackId) return track;
    const next = update(track);
    changed = changed || next !== track;
    return next;
  });

  return changed ? { ...project, tracks } : project;
}

export function reduceProject(project: StudioProject, action: ProjectAction): StudioProject {
  switch (action.type) {
    case "toggle-step":
      if (!Number.isInteger(action.step) || action.step < 0 || action.step >= 16) {
        return project;
      }
      return updateTrack(project, action.trackId, (track) => ({
        ...track,
        steps: track.steps.map((step, index) =>
          index === action.step ? { ...step, active: !step.active } : step,
        ),
      }));

    case "set-tempo": {
      const tempo = clamp(Math.round(action.value), 70, 170);
      return tempo === project.tempo ? project : { ...project, tempo };
    }

    case "set-swing": {
      const swing = clamp(action.value, 0, 0.45);
      return swing === project.swing ? project : { ...project, swing };
    }

    case "set-volume":
      return updateTrack(project, action.trackId, (track) => {
        const volume = clamp(action.value, -36, 6);
        return volume === track.volume ? track : { ...track, volume };
      });

    case "toggle-mute":
      return updateTrack(project, action.trackId, (track) => ({
        ...track,
        muted: !track.muted,
      }));

    case "toggle-solo":
      return updateTrack(project, action.trackId, (track) => ({
        ...track,
        solo: !track.solo,
      }));

    case "clear-track":
      return updateTrack(project, action.trackId, (track) => {
        if (track.steps.every((step) => !step.active)) return track;
        return {
          ...track,
          steps: track.steps.map((step) => ({ ...step, active: false })),
        };
      });
  }
}
