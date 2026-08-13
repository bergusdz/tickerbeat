import type { InstrumentPreset, StudioProject, TrackId } from "./model";
import { eventsAtStep } from "./schedule";
import { loopDurationSeconds, stepDurationSeconds, stepStartTimes } from "./timing";

export type SoundPlanTrack = {
  id: TrackId;
  volumeDb: number;
  filter: number;
  echo: number;
  instrument: InstrumentPreset;
};

export type SoundPlanEvent = {
  step: number;
  trackId: TrackId;
  notes: string[];
  startSeconds: number;
  durationSeconds: number;
  velocity: number;
};

export type SoundPlanClip = {
  assetId: string;
  startSeconds: 0;
  offsetSeconds: number;
  durationSeconds: number;
  gain: number;
};

export type SoundPlan = {
  durationSeconds: number;
  tracks: Record<TrackId, SoundPlanTrack>;
  events: SoundPlanEvent[];
  clip: SoundPlanClip | null;
};

function createClipPlan(
  project: StudioProject,
  loopDuration: number,
  clipSource?: { durationSeconds: number },
): SoundPlanClip | null {
  if (!project.clip || !clipSource || clipSource.durationSeconds <= 0) return null;
  const offsetSeconds = project.clip.trimStart * clipSource.durationSeconds;
  const requestedDuration = (project.clip.trimEnd - project.clip.trimStart) * clipSource.durationSeconds;
  const durationSeconds = Math.min(requestedDuration, loopDuration);
  if (durationSeconds <= 0) return null;

  return {
    assetId: project.clip.assetId,
    startSeconds: 0,
    offsetSeconds,
    durationSeconds,
    gain: project.clip.level,
  };
}

export function createSoundPlan(
  project: StudioProject,
  clipSource?: { durationSeconds: number },
): SoundPlan {
  const durationSeconds = loopDurationSeconds(project.tempo);
  const starts = stepStartTimes(project.tempo, project.swing);
  const tracks = Object.fromEntries(
    project.tracks.map((track) => [
      track.id,
      {
        id: track.id,
        volumeDb: track.volume,
        filter: track.filter,
        echo: track.echo,
        instrument: track.instrument,
      },
    ]),
  ) as Record<TrackId, SoundPlanTrack>;
  const events = starts.flatMap((startSeconds, step) =>
    eventsAtStep(project, step).map((event) => ({
      step,
      trackId: event.trackId,
      notes: Array.isArray(event.note) ? event.note : [event.note],
      startSeconds,
      durationSeconds:
        stepDurationSeconds(project.tempo, 0, step) *
        0.82 *
        (event.trackId === "chords" ? 1.8 : 1),
      velocity: event.velocity,
    })),
  );

  return {
    durationSeconds,
    tracks,
    events,
    clip: createClipPlan(project, durationSeconds, clipSource),
  };
}
