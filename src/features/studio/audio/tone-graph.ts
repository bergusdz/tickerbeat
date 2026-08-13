import type {
  FeedbackDelay,
  Filter,
  Gain,
  Limiter,
  MembraneSynth,
  MonoSynth,
  Player,
  PolySynth,
  Synth,
  Volume,
} from "tone";

import type { SoundPlan } from "../core/sound-plan";
import type { TrackId } from "../core/model";
import { cutoffFrequency, drumProfile, echoSendGain, oscillatorType } from "./sound-design";

export type ToneModule = typeof import("tone");

export type ToneGraph = {
  drums: MembraneSynth;
  bass: MonoSynth;
  chords: PolySynth;
  lead: Synth;
  volumes: Record<TrackId, Volume>;
  filters: Record<TrackId, Filter>;
  sends: Record<TrackId, Gain>;
  delay: FeedbackDelay;
  limiter: Limiter;
  clipGain: Gain;
  clipPlayer: Player | null;
  dispose(): void;
};

export function createToneGraph(tone: ToneModule, plan: SoundPlan): ToneGraph {
  const limiter = new tone.Limiter(-1).toDestination();
  const delay = new tone.FeedbackDelay({ delayTime: 0.24, feedback: 0.18, wet: 1 }).connect(limiter);
  const volumes = Object.fromEntries(
    Object.values(plan.tracks).map((track) => [track.id, new tone.Volume(track.volumeDb)]),
  ) as Record<TrackId, Volume>;
  const filters = Object.fromEntries(
    Object.values(plan.tracks).map((track) => [
      track.id,
      new tone.Filter({ type: "lowpass", frequency: cutoffFrequency(track.filter), rolloff: -24 }),
    ]),
  ) as Record<TrackId, Filter>;
  const sends = Object.fromEntries(
    Object.values(plan.tracks).map((track) => [track.id, new tone.Gain(echoSendGain(track.echo))]),
  ) as Record<TrackId, Gain>;

  for (const trackId of ["drums", "bass", "chords", "lead"] as const) {
    filters[trackId].connect(volumes[trackId]);
    volumes[trackId].connect(limiter);
    volumes[trackId].connect(sends[trackId]);
    sends[trackId].connect(delay);
  }

  const drumsProfile = drumProfile(plan.tracks.drums.instrument);
  const drums = new tone.MembraneSynth({
    pitchDecay: drumsProfile.pitchDecay,
    octaves: drumsProfile.octaves,
    envelope: { attack: 0.001, decay: 0.24, sustain: 0.01, release: 0.28 },
  }).connect(filters.drums);
  const bass = new tone.MonoSynth({
    oscillator: { type: oscillatorType("bass", plan.tracks.bass.instrument) },
    filter: { Q: 2, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.005, decay: 0.18, sustain: 0.22, release: 0.34 },
    filterEnvelope: {
      attack: 0.004,
      decay: 0.15,
      sustain: 0.18,
      release: 0.3,
      baseFrequency: 90,
      octaves: 3.2,
    },
  }).connect(filters.bass);
  const chords = new tone.PolySynth(tone.Synth, {
    oscillator: { type: oscillatorType("chords", plan.tracks.chords.instrument) },
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.25, release: 0.48 },
  }).connect(filters.chords);
  const lead = new tone.Synth({
    oscillator: { type: oscillatorType("lead", plan.tracks.lead.instrument) },
    envelope: { attack: 0.006, decay: 0.1, sustain: 0.12, release: 0.2 },
  }).connect(filters.lead);
  const clipGain = new tone.Gain(1).connect(limiter);

  const graph: ToneGraph = {
    drums,
    bass,
    chords,
    lead,
    volumes,
    filters,
    sends,
    delay,
    limiter,
    clipGain,
    clipPlayer: null,
    dispose() {
      graph.clipPlayer?.dispose();
      graph.clipPlayer = null;
      drums.dispose();
      bass.dispose();
      chords.dispose();
      lead.dispose();
      clipGain.dispose();
      Object.values(volumes).forEach((node) => node.dispose());
      Object.values(filters).forEach((node) => node.dispose());
      Object.values(sends).forEach((node) => node.dispose());
      delay.dispose();
      limiter.dispose();
    },
  };
  return graph;
}

export function updateToneGraph(graph: ToneGraph, plan: SoundPlan): void {
  for (const track of Object.values(plan.tracks)) {
    graph.volumes[track.id].volume.rampTo(track.volumeDb, 0.05);
    graph.filters[track.id].frequency.rampTo(cutoffFrequency(track.filter), 0.05);
    graph.sends[track.id].gain.rampTo(echoSendGain(track.echo), 0.05);
    if (track.id === "drums") {
      const profile = drumProfile(track.instrument);
      graph.drums.set({ pitchDecay: profile.pitchDecay, octaves: profile.octaves });
    } else if (track.id === "bass") {
      graph.bass.set({ oscillator: { type: oscillatorType("bass", track.instrument) } });
    } else if (track.id === "chords") {
      graph.chords.set({ oscillator: { type: oscillatorType("chords", track.instrument) } });
    } else {
      graph.lead.set({ oscillator: { type: oscillatorType("lead", track.instrument) } });
    }
  }
}

export function scheduleTonePlan(
  graph: ToneGraph,
  plan: SoundPlan,
  offsetSeconds = 0,
  onlyStep?: number,
): void {
  const events = onlyStep === undefined
    ? plan.events
    : plan.events.filter((event) => event.step === onlyStep);

  for (const event of events) {
    const time = offsetSeconds + (onlyStep === undefined ? event.startSeconds : 0);
    if (event.trackId === "drums") {
      graph.drums.triggerAttackRelease(event.notes[0], event.durationSeconds, time, event.velocity);
    } else if (event.trackId === "bass") {
      graph.bass.triggerAttackRelease(event.notes[0], event.durationSeconds, time, event.velocity);
    } else if (event.trackId === "chords") {
      graph.chords.triggerAttackRelease(event.notes, event.durationSeconds, time, event.velocity);
    } else {
      graph.lead.triggerAttackRelease(event.notes[0], event.durationSeconds, time, event.velocity);
    }
  }

  if (onlyStep !== undefined && onlyStep !== 0) return;
  if (plan.clip && graph.clipPlayer?.loaded) {
    graph.clipGain.gain.value = plan.clip.gain;
    graph.clipPlayer.start(
      offsetSeconds + plan.clip.startSeconds,
      plan.clip.offsetSeconds,
      plan.clip.durationSeconds,
    );
  }
}
