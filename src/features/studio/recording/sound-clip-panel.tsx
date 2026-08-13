"use client";

import { useRef } from "react";

import type { ReturnTypeUseSoundClip } from "./types";
import styles from "../studio.module.css";

export function SoundClipPanel({ control }: { control: ReturnTypeUseSoundClip }) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <section className={styles.clipPanel} aria-label="Sound recorder and sample import">
      <div className={styles.clipHeading}>
        <span>OPTIONAL AUDIO</span>
        <strong>{control.isRecording ? "RECORDING" : control.clip ? "CLIP READY" : "EMPTY"}</strong>
      </div>

      {control.clip ? (
        <>
          <audio aria-label="Recorded sound preview" controls preload="metadata" src={control.clip.url} />
          <div className={styles.clipMeta}>
            <span>{control.clip.source.toUpperCase()}</span>
            <strong title={control.clip.name}>{control.clip.name}</strong>
          </div>
        </>
      ) : null}

      <div className={styles.clipActions}>
        <button
          type="button"
          className={control.isRecording ? styles.recording : ""}
          onClick={() =>
            control.isRecording ? control.stopRecording() : void control.startRecording()
          }
        >
          {control.isRecording ? "STOP" : "● REC"}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()}>
          IMPORT
        </button>
        {control.clip ? (
          <button type="button" onClick={control.clearClip}>
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
          if (file) control.importFile(file);
          event.target.value = "";
        }}
      />
      {control.error ? <p className={styles.clipError}>{control.error}</p> : null}
    </section>
  );
}
