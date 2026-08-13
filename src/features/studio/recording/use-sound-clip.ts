"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_CLIP_BYTES = 10_000_000;

export type SoundClip = {
  blob: Blob;
  name: string;
  source: "microphone" | "file";
  url: string;
};

export function validateClipFile(file: File): string | null {
  if (!file.type.startsWith("audio/")) return "Choose an audio file.";
  if (file.size > MAX_CLIP_BYTES) return "Audio clips must be 10 MB or smaller.";
  return null;
}

export function useSoundClip() {
  const [clip, setClip] = useState<SoundClip | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const clipRef = useRef<SoundClip | null>(null);

  const replaceClip = useCallback((blob: Blob, name: string, source: SoundClip["source"]) => {
    if (clipRef.current) URL.revokeObjectURL(clipRef.current.url);
    const next = { blob, name, source, url: URL.createObjectURL(blob) };
    clipRef.current = next;
    setClip(next);
    setError(null);
  }, []);

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
        if (blob.size > 0) replaceClip(blob, "MIC CLIP", "microphone");
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

  const importFile = useCallback(
    (file: File) => {
      const validation = validateClipFile(file);
      if (validation) {
        setError(validation);
        return;
      }
      replaceClip(file, file.name, "file");
    },
    [replaceClip],
  );

  const clearClip = useCallback(() => {
    if (clipRef.current) URL.revokeObjectURL(clipRef.current.url);
    clipRef.current = null;
    setClip(null);
    setError(null);
  }, []);

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
  };
}
