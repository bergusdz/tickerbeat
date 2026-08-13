import type { ClipReference, InstrumentPreset, StudioProject, Track, TrackId } from "./model";

export type ProjectAction =
  | { type: "set-title"; value: string }
  | { type: "toggle-step"; trackId: TrackId; step: number }
  | { type: "toggle-accent"; trackId: TrackId; step: number }
  | { type: "set-tempo"; value: number }
  | { type: "set-swing"; value: number }
  | { type: "set-volume"; trackId: TrackId; value: number }
  | { type: "set-instrument"; trackId: TrackId; value: number }
  | { type: "set-filter"; trackId: TrackId; value: number }
  | { type: "set-echo"; trackId: TrackId; value: number }
  | { type: "toggle-mute"; trackId: TrackId }
  | { type: "toggle-solo"; trackId: TrackId }
  | { type: "set-clip"; value: ClipReference | null }
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
    case "set-title": {
      const title = action.value.trim().slice(0, 80);
      return title && title !== project.title ? { ...project, title } : project;
    }

    case "toggle-step":
      if (!Number.isInteger(action.step) || action.step < 0 || action.step >= 16) {
        return project;
      }
      return updateTrack(project, action.trackId, (track) => ({
        ...track,
        steps: track.steps.map((step, index) =>
          index === action.step
            ? { ...step, active: !step.active, velocity: step.active ? step.velocity : 0.78 }
            : step,
        ),
      }));

    case "toggle-accent":
      if (!Number.isInteger(action.step) || action.step < 0 || action.step >= 16) {
        return project;
      }
      return updateTrack(project, action.trackId, (track) => {
        const selectedStep = track.steps[action.step];
        if (!selectedStep?.active) return track;
        return {
          ...track,
          steps: track.steps.map((step, index) =>
            index === action.step
              ? { ...step, velocity: step.velocity >= 0.9 ? 0.78 : 1 }
              : step,
          ),
        };
      });

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

    case "set-instrument":
      if (!Number.isInteger(action.value) || action.value < 0 || action.value > 2) return project;
      return updateTrack(project, action.trackId, (track) =>
        track.instrument === action.value
          ? track
          : { ...track, instrument: action.value as InstrumentPreset },
      );

    case "set-filter":
      return updateTrack(project, action.trackId, (track) => {
        const filter = clamp(action.value, 0, 1);
        return filter === track.filter ? track : { ...track, filter };
      });

    case "set-echo":
      return updateTrack(project, action.trackId, (track) => {
        const echo = clamp(action.value, 0, 1);
        return echo === track.echo ? track : { ...track, echo };
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

    case "set-clip":
      return action.value === project.clip ? project : { ...project, clip: action.value };

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
