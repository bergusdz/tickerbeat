"use client";

import { useCallback, useEffect, useState } from "react";

import { ToneStudioEngine } from "./audio/tone-engine";
import type { StudioProject } from "./core/model";
import type { SoundClip } from "./recording/types";

export function useStudioAudio(project: StudioProject, clip: SoundClip | null = null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [engine] = useState(() => new ToneStudioEngine(project, setCurrentStep));

  useEffect(() => () => engine.dispose(), [engine]);

  useEffect(() => {
    engine.update(project);
  }, [engine, project]);

  useEffect(() => {
    engine.updateClip(clip);
  }, [clip, engine]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }

    try {
      await engine.start();
      setIsPlaying(true);
    } catch {
      engine.stop();
      setIsPlaying(false);
    }
  }, [engine, isPlaying]);

  return { isPlaying, currentStep, togglePlayback };
}
