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

import type { StudioProject, TrackId } from "../core/model";
import { eventsAtStep } from "../core/schedule";
import { clipPlaybackWindow } from "../recording/clip-playback";
import type { SoundClip } from "../recording/use-sound-clip";
import { cutoffFrequency, drumProfile, echoSendGain, oscillatorType } from "./sound-design";

type ToneModule = typeof import("tone");

export function isSchedulableAudioTime(time: number): boolean {
  return Number.isFinite(time) && time >= 0;
}

export function stepDurationMs(tempo: number, swing: number, step: number): number {
  const sixteenth = 60_000 / tempo / 4;
  return sixteenth * (step % 2 === 0 ? 1 + swing : 1 - swing);
}

export function loopDurationSeconds(tempo: number): number {
  return (60 / tempo) * 4;
}

export function clipShouldTriggerAtStep(step: number): boolean {
  return step === 0;
}

export class ToneStudioEngine {
  private tone: ToneModule | null = null;
  private project: StudioProject;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;
  private drums: MembraneSynth | null = null;
  private bass: MonoSynth | null = null;
  private chords: PolySynth | null = null;
  private lead: Synth | null = null;
  private volumes: Record<TrackId, Volume> | null = null;
  private filters: Record<TrackId, Filter> | null = null;
  private sends: Record<TrackId, Gain> | null = null;
  private delay: FeedbackDelay | null = null;
  private limiter: Limiter | null = null;
  private clip: SoundClip | null = null;
  private clipPlayer: Player | null = null;
  private clipGain: Gain | null = null;
  private loadedClipUrl: string | null = null;
  private clipLoadVersion = 0;

  constructor(
    project: StudioProject,
    private readonly onStep: (step: number) => void,
  ) {
    this.project = project;
  }

  async start(): Promise<void> {
    if (!this.tone) await this.initialize();
    if (!this.tone) return;

    await this.tone.start();
    if (this.clip && this.loadedClipUrl !== this.clip.url) {
      await this.loadClip(this.clip);
    }
    if (this.timer === null) this.scheduleNextStep();
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.clipPlayer?.stop();
    this.step = 0;
    this.onStep(0);
  }

  update(project: StudioProject): void {
    this.project = project;
    if (!this.tone || !this.volumes || !this.filters || !this.sends) return;

    for (const track of project.tracks) {
      this.volumes[track.id].volume.rampTo(track.volume, 0.05);
      this.filters[track.id].frequency.rampTo(cutoffFrequency(track.filter), 0.05);
      this.sends[track.id].gain.rampTo(echoSendGain(track.echo), 0.05);
      if (track.id === "drums") {
        const profile = drumProfile(track.instrument);
        this.drums?.set({ pitchDecay: profile.pitchDecay, octaves: profile.octaves });
      } else if (track.id === "bass") {
        this.bass?.set({ oscillator: { type: oscillatorType("bass", track.instrument) } });
      } else if (track.id === "chords") {
        this.chords?.set({ oscillator: { type: oscillatorType("chords", track.instrument) } });
      } else {
        this.lead?.set({ oscillator: { type: oscillatorType("lead", track.instrument) } });
      }
    }
  }

  updateClip(clip: SoundClip | null): void {
    this.clip = clip;
    if (!this.tone) return;

    if (clip && clip.url === this.loadedClipUrl && this.clipPlayer && this.clipGain) {
      this.clipGain.gain.rampTo(clip.level, 0.05);
      return;
    }

    void this.loadClip(clip);
  }

  dispose(): void {
    if (!this.tone) return;

    if (this.timer !== null) clearTimeout(this.timer);

    this.drums?.dispose();
    this.bass?.dispose();
    this.chords?.dispose();
    this.lead?.dispose();
    this.clipLoadVersion += 1;
    this.clipPlayer?.dispose();
    this.clipGain?.dispose();
    Object.values(this.volumes ?? {}).forEach((volume) => volume.dispose());
    Object.values(this.filters ?? {}).forEach((filter) => filter.dispose());
    Object.values(this.sends ?? {}).forEach((send) => send.dispose());
    this.delay?.dispose();
    this.limiter?.dispose();

    this.timer = null;
    this.tone = null;
    this.clipPlayer = null;
    this.clipGain = null;
    this.loadedClipUrl = null;
  }

  private async initialize(): Promise<void> {
    const tone = await import("tone");
    this.tone = tone;

    this.limiter = new tone.Limiter(-1).toDestination();
    this.delay = new tone.FeedbackDelay({
      delayTime: 0.24,
      feedback: 0.18,
      wet: 1,
    }).connect(this.limiter);

    this.volumes = {
      drums: new tone.Volume(-4),
      bass: new tone.Volume(-7),
      chords: new tone.Volume(-12),
      lead: new tone.Volume(-13),
    };
    this.filters = {
      drums: new tone.Filter({ type: "lowpass", frequency: 12_000, rolloff: -24 }),
      bass: new tone.Filter({ type: "lowpass", frequency: 1_200, rolloff: -24 }),
      chords: new tone.Filter({ type: "lowpass", frequency: 3_000, rolloff: -24 }),
      lead: new tone.Filter({ type: "lowpass", frequency: 4_000, rolloff: -24 }),
    };
    this.sends = {
      drums: new tone.Gain(0),
      bass: new tone.Gain(0),
      chords: new tone.Gain(0),
      lead: new tone.Gain(0),
    };

    for (const trackId of ["drums", "bass", "chords", "lead"] as const) {
      this.filters[trackId].connect(this.volumes[trackId]);
      this.volumes[trackId].connect(this.limiter);
      this.volumes[trackId].connect(this.sends[trackId]);
      this.sends[trackId].connect(this.delay);
    }

    this.drums = new tone.MembraneSynth({
      pitchDecay: 0.028,
      octaves: 7,
      envelope: { attack: 0.001, decay: 0.24, sustain: 0.01, release: 0.28 },
    }).connect(this.filters.drums);

    this.bass = new tone.MonoSynth({
      oscillator: { type: "sawtooth" },
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
    }).connect(this.filters.bass);

    this.chords = new tone.PolySynth(tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.25, release: 0.48 },
    }).connect(this.filters.chords);

    this.lead = new tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.006, decay: 0.1, sustain: 0.12, release: 0.2 },
    }).connect(this.filters.lead);

    this.update(this.project);
  }

  private scheduleNextStep(): void {
    if (!this.tone) return;

    const current = this.step;
    const time = this.tone.now() + 0.02;
    if (isSchedulableAudioTime(time)) {
      if (clipShouldTriggerAtStep(current)) this.triggerClip(time);
      for (const event of eventsAtStep(this.project, current)) {
        this.trigger(event.trackId, event.note, event.velocity, time);
      }
      this.tone.getDraw().schedule(() => this.onStep(current), time);
    }

    const duration = stepDurationMs(this.project.tempo, this.project.swing, current);
    this.step = (current + 1) % 16;
    this.timer = setTimeout(() => this.scheduleNextStep(), duration);
  }

  private async loadClip(clip: SoundClip | null): Promise<void> {
    const version = ++this.clipLoadVersion;
    this.clipPlayer?.stop();
    this.clipPlayer?.dispose();
    this.clipPlayer = null;
    this.loadedClipUrl = null;

    if (!clip || !this.tone || !this.limiter) return;

    const player = new this.tone.Player();
    try {
      await player.load(clip.url);
      if (version !== this.clipLoadVersion) {
        player.dispose();
        return;
      }

      if (!this.clipGain) this.clipGain = new this.tone.Gain(clip.level).connect(this.limiter);
      player.connect(this.clipGain);
      this.clipGain.gain.value = clip.level;
      this.clipPlayer = player;
      this.loadedClipUrl = clip.url;
    } catch {
      player.dispose();
    }
  }

  private triggerClip(time: number): void {
    if (!this.clip || !this.clipPlayer?.loaded || !this.clipGain) return;
    const window = clipPlaybackWindow(
      this.clipPlayer.buffer.duration,
      this.clip,
      loopDurationSeconds(this.project.tempo),
    );
    if (!window) return;

    this.clipGain.gain.rampTo(window.gain, 0.02);
    this.clipPlayer.start(time, window.offset, window.duration);
  }

  private trigger(
    trackId: TrackId,
    note: string | string[],
    velocity: number,
    time: number,
  ): void {
    const duration = Math.max(0.04, stepDurationMs(this.project.tempo, 0, this.step) / 1_000 * 0.82);
    switch (trackId) {
      case "drums":
        this.drums?.triggerAttackRelease(note as string, duration, time, velocity);
        break;
      case "bass":
        this.bass?.triggerAttackRelease(note as string, duration, time, velocity);
        break;
      case "chords":
        this.chords?.triggerAttackRelease(note, duration * 1.8, time, velocity);
        break;
      case "lead":
        this.lead?.triggerAttackRelease(note as string, duration, time, velocity);
        break;
    }
  }
}
