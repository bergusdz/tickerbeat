import type { StudioProject, TrackId } from "../core/model";
import { eventsAtStep } from "../core/schedule";
import { stepDurationMs } from "../audio/tone-engine";
import { audioBufferToWav, projectDurationSeconds } from "./render-utils";

const SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function noteToFrequency(note: string): number {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(note);
  if (!match) throw new Error(`Unsupported note: ${note}`);

  const [, letter, accidental, octaveText] = match;
  const accidentalOffset = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  const midi = (Number(octaveText) + 1) * 12 + SEMITONES[letter] + accidentalOffset;
  return 440 * 2 ** ((midi - 69) / 12);
}

export function stepStartTimes(project: StudioProject): number[] {
  const starts: number[] = [];
  let cursor = 0;

  for (let step = 0; step < 16; step += 1) {
    starts.push(cursor);
    cursor += stepDurationMs(project.tempo, project.swing, step) / 1_000;
  }

  return starts;
}

function dbToGain(decibels: number): number {
  return 10 ** (decibels / 20);
}

function scheduleVoice(
  context: OfflineAudioContext,
  output: AudioNode,
  trackId: Exclude<TrackId, "drums">,
  frequency: number,
  start: number,
  duration: number,
  velocity: number,
  trackGain: number,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = trackId === "bass" ? "sawtooth" : trackId === "chords" ? "triangle" : "square";
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, velocity * trackGain), start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function scheduleDrum(
  context: OfflineAudioContext,
  output: AudioNode,
  start: number,
  velocity: number,
  trackGain: number,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(135, start);
  oscillator.frequency.exponentialRampToValueAtTime(43, start + 0.16);
  envelope.gain.setValueAtTime(Math.max(0.0001, velocity * trackGain), start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
  oscillator.connect(envelope).connect(output);
  oscillator.start(start);
  oscillator.stop(start + 0.22);
}

export async function renderProjectToWav(
  project: StudioProject,
  optionalClip?: AudioBuffer,
): Promise<Blob> {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("Offline audio rendering is not supported in this browser.");
  }

  const sampleRate = 44_100;
  const duration = projectDurationSeconds(project);
  const context = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -8;
  compressor.knee.value = 8;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.16;
  compressor.connect(context.destination);

  const starts = stepStartTimes(project);
  for (let step = 0; step < 16; step += 1) {
    const start = starts[step];
    const noteDuration = Math.max(0.05, stepDurationMs(project.tempo, 0, step) / 1_000 * 0.82);
    for (const event of eventsAtStep(project, step)) {
      const track = project.tracks.find((candidate) => candidate.id === event.trackId);
      const trackGain = dbToGain(track?.volume ?? -12) * 0.32;
      if (event.trackId === "drums") {
        scheduleDrum(context, compressor, start, event.velocity, trackGain);
        continue;
      }

      const notes = Array.isArray(event.note) ? event.note : [event.note];
      for (const note of notes) {
        scheduleVoice(
          context,
          compressor,
          event.trackId,
          noteToFrequency(note),
          start,
          event.trackId === "chords" ? noteDuration * 1.8 : noteDuration,
          event.velocity / Math.sqrt(notes.length),
          trackGain,
        );
      }
    }
  }

  if (optionalClip) {
    const source = context.createBufferSource();
    const clipGain = context.createGain();
    source.buffer = optionalClip;
    clipGain.gain.value = 0.7;
    source.connect(clipGain).connect(compressor);
    source.start(0, 0, Math.min(optionalClip.duration, duration));
  }

  return audioBufferToWav(await context.startRendering());
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  if (typeof AudioContext === "undefined") {
    throw new Error("Audio decoding is not supported in this browser.");
  }

  const context = new AudioContext();
  try {
    return await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close();
  }
}
