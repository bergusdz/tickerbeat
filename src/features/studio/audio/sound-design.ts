import type { InstrumentPreset, TrackId } from "../core/model";

type OscillatorWave = "sawtooth" | "square" | "triangle" | "sine";

export const INSTRUMENT_LABELS: Record<TrackId, readonly [string, string, string]> = {
  drums: ["909 KICK", "SUB KICK", "TIGHT KICK"],
  bass: ["SAW", "SQUARE", "TRIANGLE"],
  chords: ["TRIANGLE", "SAW", "SINE"],
  lead: ["SQUARE", "SAW", "SINE"],
};

const OSCILLATORS: Record<Exclude<TrackId, "drums">, readonly [OscillatorWave, OscillatorWave, OscillatorWave]> = {
  bass: ["sawtooth", "square", "triangle"],
  chords: ["triangle", "sawtooth", "sine"],
  lead: ["square", "sawtooth", "sine"],
};

const DRUMS = [
  { startFrequency: 135, endFrequency: 43, decay: 0.2, pitchDecay: 0.028, octaves: 7 },
  { startFrequency: 92, endFrequency: 34, decay: 0.32, pitchDecay: 0.055, octaves: 5 },
  { startFrequency: 178, endFrequency: 58, decay: 0.12, pitchDecay: 0.018, octaves: 8 },
] as const;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function instrumentLabel(trackId: TrackId, preset: number): string {
  return INSTRUMENT_LABELS[trackId][preset as InstrumentPreset] ?? INSTRUMENT_LABELS[trackId][0];
}

export function oscillatorType(
  trackId: Exclude<TrackId, "drums">,
  preset: InstrumentPreset,
): OscillatorWave {
  return OSCILLATORS[trackId][preset];
}

export function drumProfile(preset: InstrumentPreset) {
  return DRUMS[preset];
}

export function cutoffFrequency(value: number): number {
  const normalized = clamp01(value);
  return Math.round(180 * (12_000 / 180) ** normalized);
}

export function echoSendGain(value: number): number {
  return clamp01(value) * 0.45;
}
