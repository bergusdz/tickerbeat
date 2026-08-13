"use client";

import { useRef, useState } from "react";

import type { SoundClipController } from "./types";
import styles from "../studio.module.css";

export function SoundClipPanel({ control }: { control: SoundClipController }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const previewAudio = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const stopPreview = () => {
    previewAudio.current?.pause();
    setIsPreviewing(false);
  };

  const togglePreview = async () => {
    const audio = previewAudio.current;
    const clip = control.clip;
    if (!audio || !clip || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    if (isPreviewing) {
      stopPreview();
      return;
    }

    audio.currentTime = audio.duration * clip.trimStart;
    audio.volume = clip.level;
    try {
      await audio.play();
      setIsPreviewing(true);
    } catch {
      setIsPreviewing(false);
    }
  };

  return (
    <section className={styles.clipPanel} aria-label="Sound recorder and sample import">
      <div className={styles.clipHeading}>
        <span>OPTIONAL AUDIO</span>
        <strong>{control.isRecording ? "RECORDING" : control.clip ? "CLIP READY" : "EMPTY"}</strong>
      </div>

      {control.clip ? (
        <>
          <audio
            ref={previewAudio}
            className={styles.clipPreviewAudio}
            preload="metadata"
            src={control.clip.url}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onPause={() => setIsPreviewing(false)}
            onEnded={() => setIsPreviewing(false)}
            onTimeUpdate={(event) => {
              const audio = event.currentTarget;
              const clip = control.clip;
              if (clip && audio.currentTime >= audio.duration * clip.trimEnd) {
                audio.pause();
                audio.currentTime = audio.duration * clip.trimStart;
              }
            }}
          />
          <div className={styles.clipMeta}>
            <span>{control.clip.source.toUpperCase()}</span>
            <strong title={control.clip.name}>{control.clip.name}</strong>
          </div>
          <div className={styles.clipEditor}>
            <label className={styles.clipControl}>
              <span>START</span>
              <input
                aria-label="Clip start"
                type="range"
                min="0"
                max="100"
                value={Math.round(control.clip.trimStart * 100)}
                onChange={(event) =>
                  control.setClipSettings({ trimStart: Number(event.target.value) / 100 })
                }
              />
              <output>{Math.round(control.clip.trimStart * 100)}</output>
            </label>
            <label className={styles.clipControl}>
              <span>END</span>
              <input
                aria-label="Clip end"
                type="range"
                min="0"
                max="100"
                value={Math.round(control.clip.trimEnd * 100)}
                onChange={(event) =>
                  control.setClipSettings({ trimEnd: Number(event.target.value) / 100 })
                }
              />
              <output>{Math.round(control.clip.trimEnd * 100)}</output>
            </label>
            <label className={styles.clipControl}>
              <span>LEVEL</span>
              <input
                aria-label="Clip level"
                type="range"
                min="0"
                max="100"
                value={Math.round(control.clip.level * 100)}
                onChange={(event) => {
                  const level = Number(event.target.value) / 100;
                  control.setClipSettings({ level });
                  if (previewAudio.current) previewAudio.current.volume = level;
                }}
              />
              <output>{Math.round(control.clip.level * 100)}</output>
            </label>
            <small>
              {duration > 0
                ? `${(duration * control.clip.trimStart).toFixed(1)}–${(duration * control.clip.trimEnd).toFixed(1)}S`
                : "READING AUDIO"}
            </small>
          </div>
        </>
      ) : null}

      <div className={styles.clipActions}>
        {control.clip ? (
          <button
            type="button"
            aria-label="Preview sample clip"
            className={isPreviewing ? styles.previewing : ""}
            onClick={() => void togglePreview()}
          >
            {isPreviewing ? "STOP PREVIEW" : "PREVIEW"}
          </button>
        ) : null}
        <button
          type="button"
          className={control.isRecording ? styles.recording : ""}
          onClick={() => {
            stopPreview();
            if (control.isRecording) control.stopRecording();
            else void control.startRecording();
          }}
        >
          {control.isRecording ? "STOP" : "● REC"}
        </button>
        <button type="button" onClick={() => {
          stopPreview();
          fileInput.current?.click();
        }}>
          IMPORT
        </button>
        {control.clip ? (
          <button type="button" onClick={() => {
            stopPreview();
            control.clearClip();
          }}>
            REMOVE
          </button>
        ) : null}
      </div>

      <input
        ref={fileInput}
        className={styles.visuallyHidden}
        aria-label="Import an audio clip"
        type="file"
        accept="audio/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            stopPreview();
            setDuration(0);
            void control.importFile(file);
          }
          event.target.value = "";
        }}
      />
      {control.error ? <p className={styles.clipError}>{control.error}</p> : null}
    </section>
  );
}
