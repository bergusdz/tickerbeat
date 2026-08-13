import type { StudioProject } from "../core/model";
import { createSoundPlan } from "../core/sound-plan";
import {
  loopDurationSeconds as projectLoopDurationSeconds,
  stepDurationSeconds,
} from "../core/timing";
import type { SoundClip } from "../recording/types";
import {
  createToneGraph,
  scheduleTonePlan,
  updateToneGraph,
  type ToneGraph,
  type ToneModule,
} from "./tone-graph";

export function isSchedulableAudioTime(time: number): boolean {
  return Number.isFinite(time) && time >= 0;
}

export function stepDurationMs(tempo: number, swing: number, step: number): number {
  return stepDurationSeconds(tempo, swing, step) * 1_000;
}

export function loopDurationSeconds(tempo: number): number {
  return projectLoopDurationSeconds(tempo);
}

export function clipShouldTriggerAtStep(step: number): boolean {
  return step === 0;
}

export class ToneStudioEngine {
  private tone: ToneModule | null = null;
  private graph: ToneGraph | null = null;
  private project: StudioProject;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;
  private clip: SoundClip | null = null;
  private loadedClipUrl: string | null = null;
  private clipLoadVersion = 0;

  constructor(
    project: StudioProject,
    private readonly onStep: (step: number) => void,
  ) {
    this.project = project;
  }

  async start(): Promise<void> {
    if (!this.tone || !this.graph) await this.initialize();
    if (!this.tone || !this.graph) return;

    await this.tone.start();
    if (this.clip && this.loadedClipUrl !== this.clip.url) await this.loadClip(this.clip);
    if (this.timer === null) this.scheduleNextStep();
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.graph?.clipPlayer?.stop();
    this.step = 0;
    this.onStep(0);
  }

  update(project: StudioProject): void {
    this.project = project;
    if (this.graph) updateToneGraph(this.graph, createSoundPlan(project));
  }

  updateClip(clip: SoundClip | null): void {
    this.clip = clip;
    if (!this.tone || !this.graph) return;

    if (clip && clip.url === this.loadedClipUrl) {
      this.graph.clipGain.gain.rampTo(clip.level, 0.05);
      return;
    }

    void this.loadClip(clip);
  }

  dispose(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.clipLoadVersion += 1;
    this.graph?.dispose();
    this.timer = null;
    this.tone = null;
    this.graph = null;
    this.loadedClipUrl = null;
  }

  private async initialize(): Promise<void> {
    const tone = await import("tone");
    this.tone = tone;
    this.graph = createToneGraph(tone, createSoundPlan(this.project));
  }

  private scheduleNextStep(): void {
    if (!this.tone || !this.graph) return;

    const current = this.step;
    const time = this.tone.now() + 0.02;
    if (isSchedulableAudioTime(time)) {
      const clipSource = this.clip && this.graph.clipPlayer?.loaded
        ? { durationSeconds: this.graph.clipPlayer.buffer.duration }
        : undefined;
      scheduleTonePlan(this.graph, createSoundPlan(this.project, clipSource), time, current);
      this.tone.getDraw().schedule(() => this.onStep(current), time);
    }

    const duration = stepDurationMs(this.project.tempo, this.project.swing, current);
    this.step = (current + 1) % 16;
    this.timer = setTimeout(() => this.scheduleNextStep(), duration);
  }

  private async loadClip(clip: SoundClip | null): Promise<void> {
    const version = ++this.clipLoadVersion;
    const graph = this.graph;
    graph?.clipPlayer?.stop();
    graph?.clipPlayer?.dispose();
    if (graph) graph.clipPlayer = null;
    this.loadedClipUrl = null;

    if (!clip || !this.tone || !graph) return;

    const player = new this.tone.Player();
    try {
      await player.load(clip.url);
      if (version !== this.clipLoadVersion) {
        player.dispose();
        return;
      }

      player.connect(graph.clipGain);
      graph.clipGain.gain.value = clip.level;
      graph.clipPlayer = player;
      this.loadedClipUrl = clip.url;
    } catch {
      player.dispose();
    }
  }
}
