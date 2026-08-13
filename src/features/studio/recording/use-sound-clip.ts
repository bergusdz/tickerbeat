"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ClipReference } from "../core/model";
import type { ClipAssetStore } from "./clip-asset-store";
import { updateClipSettings, type ClipPlaybackSettings } from "./clip-playback";
import { createClipReference } from "./clip-reference";
import { IndexedDbClipAssetStore } from "./indexeddb-clip-store";
import type { SoundClip, SoundClipController } from "./types";

const MAX_CLIP_BYTES = 10_000_000;

export function validateClipFile(file: File): string | null {
  if (!file.type.startsWith("audio/")) return "Choose an audio file.";
  if (file.size > MAX_CLIP_BYTES) return "Audio clips must be 10 MB or smaller.";
  return null;
}

function loadedClip(reference: ClipReference, blob: Blob, url: string): SoundClip {
  return { ...reference, blob, url };
}

export function useSoundClip(
  reference: ClipReference | null = null,
  onReferenceChange: (reference: ClipReference | null) => void = () => undefined,
  providedStore?: ClipAssetStore,
): SoundClipController {
  const [store] = useState<ClipAssetStore>(() => providedStore ?? new IndexedDbClipAssetStore());
  const [clip, setClip] = useState<SoundClip | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const clipRef = useRef<SoundClip | null>(null);

  const replaceLoadedClip = useCallback((next: SoundClip | null) => {
    if (clipRef.current?.url && clipRef.current.url !== next?.url) {
      URL.revokeObjectURL(clipRef.current.url);
    }
    clipRef.current = next;
    setClip(next);
  }, []);

  const replaceClip = useCallback(async (blob: Blob, name: string, source: ClipReference["source"]) => {
    try {
      const nextReference = await createClipReference(blob, name, source);
      await store.put(nextReference, blob);
      const next = loadedClip(nextReference, blob, URL.createObjectURL(blob));
      replaceLoadedClip(next);
      onReferenceChange(nextReference);
      setError(null);
    } catch {
      setError("The audio clip could not be stored safely.");
    }
  }, [onReferenceChange, replaceLoadedClip, store]);

  useEffect(() => {
    let cancelled = false;
    if (!reference) {
      queueMicrotask(() => {
        if (!cancelled) replaceLoadedClip(null);
      });
      return () => {
        cancelled = true;
      };
    }

    if (clipRef.current?.assetId === reference.assetId) {
      const current = clipRef.current;
      const next = loadedClip(reference, current.blob, current.url);
      clipRef.current = next;
      setClip(next);
      return () => {
        cancelled = true;
      };
    }

    void store.get(reference).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setError("The saved audio clip is missing. Import it again to continue.");
        replaceLoadedClip(null);
        return;
      }
      replaceLoadedClip(loadedClip(reference, blob, URL.createObjectURL(blob)));
      setError(null);
    }).catch(() => {
      if (!cancelled) {
        setError("The saved audio clip failed its integrity check.");
        replaceLoadedClip(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference, replaceLoadedClip, store]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 0) void replaceClip(blob, "MIC CLIP", "microphone");
        setIsRecording(false);
        stopStream();
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone permission was not granted.");
      stopStream();
    }
  }, [replaceClip, stopStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const importFile = useCallback(async (file: File) => {
    const validation = validateClipFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    await replaceClip(file, file.name, "file");
  }, [replaceClip]);

  const clearClip = useCallback(() => {
    replaceLoadedClip(null);
    onReferenceChange(null);
    setError(null);
  }, [onReferenceChange, replaceLoadedClip]);

  const setClipSettings = useCallback((patch: Partial<ClipPlaybackSettings>) => {
    setClip((current) => {
      if (!current) return current;
      const settings = updateClipSettings(current, patch);
      const next = { ...current, ...settings };
      clipRef.current = next;
      const nextReference: ClipReference = {
        assetId: next.assetId,
        sha256: next.sha256,
        name: next.name,
        mimeType: next.mimeType,
        size: next.size,
        source: next.source,
        level: next.level,
        trimStart: next.trimStart,
        trimEnd: next.trimEnd,
      };
      onReferenceChange(nextReference);
      return next;
    });
  }, [onReferenceChange]);

  useEffect(
    () => () => {
      if (recorderRef.current) {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.onstop = null;
        if (recorderRef.current.state === "recording") recorderRef.current.stop();
      }
      stopStream();
      if (clipRef.current) URL.revokeObjectURL(clipRef.current.url);
    },
    [stopStream],
  );

  return {
    clip,
    error,
    importFile,
    isRecording,
    startRecording,
    stopRecording,
    clearClip,
    setClipSettings,
  };
}
