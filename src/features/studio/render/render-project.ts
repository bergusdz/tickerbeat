import type { StudioProject, Track, TrackId } from "../core/model";
import { eventsAtStep } from "../core/schedule";
import { stepDurationMs } from "../audio/tone-engine";
import { cutoffFrequency, drumProfile, echoSendGain, oscillatorType } from "../audio/sound-design";
import { clipPlaybackWindow, type ClipPlaybackSettings } from "../recording/clip-playback";
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
  waveform: OscillatorType,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = waveform;
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
  instrument: Track["instrument"],
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const profile = drumProfile(instrument);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(profile.startFrequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(profile.endFrequency, start + profile.decay * 0.8);
  envelope.gain.setValueAtTime(Math.max(0.0001, velocity * trackGain), start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + profile.decay);
  oscillator.connect(envelope).connect(output);
  oscillator.start(start);
  oscillator.stop(start + profile.decay + 0.02);
}

function createTrackBuses(
  context: OfflineAudioContext,
  project: StudioProject,
  dryOutput: AudioNode,
): Record<TrackId, BiquadFilterNode> {
  const delay = context.createDelay(1);
  const feedback = context.createGain();
  delay.delayTime.value = 0.24;
  feedback.gain.value = 0.18;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(dryOutput);

  return Object.fromEntries(project.tracks.map((track) => {
    const filter = context.createBiquadFilter();
    const send = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = cutoffFrequency(track.filter);
    send.gain.value = echoSendGain(track.echo);
    filter.connect(dryOutput);
    filter.connect(send);
    send.connect(delay);
    return [track.id, filter];
  })) as Record<TrackId, BiquadFilterNode>;
}

export async function renderProjectToWav(
  project: StudioProject,
  optionalClip?: { buffer: AudioBuffer; settings: ClipPlaybackSettings },
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
  const trackBuses = createTrackBuses(context, project, compressor);

  const starts = stepStartTimes(project);
  for (let step = 0; step < 16; step += 1) {
    const start = starts[step];
    const noteDuration = Math.max(0.05, stepDurationMs(project.tempo, 0, step) / 1_000 * 0.82);
    for (const event of eventsAtStep(project, step)) {
      const track = project.tracks.find((candidate) => candidate.id === event.trackId);
      const trackGain = dbToGain(track?.volume ?? -12) * 0.32;
      if (event.trackId === "drums") {
        scheduleDrum(
          context,
          trackBuses.drums,
          start,
          event.velocity,
          trackGain,
          track?.instrument ?? 0,
        );
        continue;
      }

      const notes = Array.isArray(event.note) ? event.note : [event.note];
      for (const note of notes) {
        scheduleVoice(
          context,
          trackBuses[event.trackId],
          event.trackId,
          noteToFrequency(note),
          start,
          event.trackId === "chords" ? noteDuration * 1.8 : noteDuration,
          event.velocity / Math.sqrt(notes.length),
          trackGain,
          oscillatorType(event.trackId, track?.instrument ?? 0),
        );
      }
    }
  }

  if (optionalClip) {
    const window = clipPlaybackWindow(optionalClip.buffer.duration, optionalClip.settings, duration);
    if (!window) return audioBufferToWav(await context.startRendering());
    const source = context.createBufferSource();
    const clipGain = context.createGain();
    source.buffer = optionalClip.buffer;
    clipGain.gain.value = window.gain;
    source.connect(clipGain).connect(compressor);
    source.start(0, window.offset, window.duration);
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
