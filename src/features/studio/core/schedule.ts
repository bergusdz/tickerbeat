import type { StudioProject, TrackId } from "./model";

export type StepEvent = {
  trackId: TrackId;
  note: string | string[];
  velocity: number;
};

export function eventsAtStep(project: StudioProject, rawStep: number): StepEvent[] {
  const stepIndex = ((Math.trunc(rawStep) % 16) + 16) % 16;
  const hasSolo = project.tracks.some((track) => track.solo);

  return project.tracks.flatMap((track) => {
    const audible = hasSolo ? track.solo : !track.muted;
    const step = track.steps[stepIndex];
    if (!audible || !step?.active) return [];

    return [{ trackId: track.id, note: track.note, velocity: step.velocity }];
  });
}
