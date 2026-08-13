import type { StudioProject } from "../core/model";
import { createSoundPlan } from "../core/sound-plan";
import {
  createToneGraph,
  scheduleTonePlan,
  type ToneGraph,
} from "../audio/tone-graph";
import type { ClipPlaybackSettings } from "../recording/clip-playback";
import { audioBufferToWav } from "./render-utils";

export async function renderProjectToWav(
  project: StudioProject,
  optionalClip?: { buffer: AudioBuffer; settings: ClipPlaybackSettings },
): Promise<Blob> {
  const tone = await import("tone");
  const plan = createSoundPlan(
    project,
    optionalClip ? { durationSeconds: optionalClip.buffer.duration } : undefined,
  );
  const graphHolder: { current: ToneGraph | null } = { current: null };

  try {
    const buffer = await tone.Offline(() => {
      const graph = createToneGraph(tone, plan);
      graphHolder.current = graph;
      if (optionalClip && plan.clip) {
        graph.clipPlayer = new tone.Player(optionalClip.buffer).connect(graph.clipGain);
      }
      scheduleTonePlan(graph, plan);
    }, plan.durationSeconds, 2, 44_100);

    return audioBufferToWav(buffer);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("The audio project could not be rendered.");
  } finally {
    graphHolder.current?.dispose();
  }
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
