import type {
  FeedbackDelay,
  Limiter,
  MembraneSynth,
  MonoSynth,
  PolySynth,
  Synth,
  Volume,
} from "tone";

import type { StudioProject, TrackId } from "../core/model";
import { eventsAtStep } from "../core/schedule";

type ToneModule = typeof import("tone");

export function isSchedulableAudioTime(time: number): boolean {
  return Number.isFinite(time) && time >= 0;
}

export function stepDurationMs(tempo: number, swing: number, step: number): number {
  const sixteenth = 60_000 / tempo / 4;
  return sixteenth * (step % 2 === 0 ? 1 + swing : 1 - swing);
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
  private delay: FeedbackDelay | null = null;
  private limiter: Limiter | null = null;

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
    if (this.timer === null) this.scheduleNextStep();
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.step = 0;
    this.onStep(0);
  }

  update(project: StudioProject): void {
    this.project = project;
    if (!this.tone || !this.volumes) return;

    for (const track of project.tracks) {
      this.volumes[track.id].volume.rampTo(track.volume, 0.05);
    }
  }

  dispose(): void {
    if (!this.tone) return;

    if (this.timer !== null) clearTimeout(this.timer);

    this.drums?.dispose();
    this.bass?.dispose();
    this.chords?.dispose();
    this.lead?.dispose();
    Object.values(this.volumes ?? {}).forEach((volume) => volume.dispose());
    this.delay?.dispose();
    this.limiter?.dispose();

    this.timer = null;
    this.tone = null;
  }

  private async initialize(): Promise<void> {
    const tone = await import("tone");
    this.tone = tone;

    this.limiter = new tone.Limiter(-1).toDestination();
    this.delay = new tone.FeedbackDelay({
      delayTime: 0.24,
      feedback: 0.18,
      wet: 0.12,
    }).connect(this.limiter);

    this.volumes = {
      drums: new tone.Volume(-4).connect(this.delay),
      bass: new tone.Volume(-7).connect(this.delay),
      chords: new tone.Volume(-12).connect(this.delay),
      lead: new tone.Volume(-13).connect(this.delay),
    };

    this.drums = new tone.MembraneSynth({
      pitchDecay: 0.028,
      octaves: 7,
      envelope: { attack: 0.001, decay: 0.24, sustain: 0.01, release: 0.28 },
    }).connect(this.volumes.drums);

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
    }).connect(this.volumes.bass);

    this.chords = new tone.PolySynth(tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.25, release: 0.48 },
    }).connect(this.volumes.chords);

    this.lead = new tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.006, decay: 0.1, sustain: 0.12, release: 0.2 },
    }).connect(this.volumes.lead);

    this.update(this.project);
  }

  private scheduleNextStep(): void {
    if (!this.tone) return;

    const current = this.step;
    const time = this.tone.now() + 0.02;
    if (isSchedulableAudioTime(time)) {
      for (const event of eventsAtStep(this.project, current)) {
        this.trigger(event.trackId, event.note, event.velocity, time);
      }
      this.tone.getDraw().schedule(() => this.onStep(current), time);
    }

    const duration = stepDurationMs(this.project.tempo, this.project.swing, current);
    this.step = (current + 1) % 16;
    this.timer = setTimeout(() => this.scheduleNextStep(), duration);
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
        this.drums?.triggerAttackRelease("C1", duration, time, velocity);
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
