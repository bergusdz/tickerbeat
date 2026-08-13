"use client";

import { useEffect, useMemo, useState } from "react";

import type { StudioProject } from "../core/model";
import type { SoundClip } from "../recording/use-sound-clip";
import styles from "../studio.module.css";
import { PublishPanel } from "../../publication/publish-panel";
import type { PublishableArtifact } from "../../publication/types";
import { decodeAudioBlob, renderProjectToWav } from "./render-project";
import { createCoverSvg } from "./render-utils";

type FinishedArtifact = PublishableArtifact;

export function symbolFromTitle(title: string): string {
  const compact = title.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return compact || "BEAT";
}

function revokeArtifact(artifact: FinishedArtifact | null): void {
  if (!artifact) return;
  URL.revokeObjectURL(artifact.audioUrl);
  URL.revokeObjectURL(artifact.coverUrl);
  URL.revokeObjectURL(artifact.projectUrl);
}

export function FinishPanel({
  project,
  clip,
  onTitleChange,
}: {
  project: StudioProject;
  clip: SoundClip | null;
  onTitleChange: (title: string) => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [symbol, setSymbol] = useState(() => symbolFromTitle(project.title));
  const [status, setStatus] = useState<"idle" | "rendering" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<FinishedArtifact | null>(null);
  const [artifactSource, setArtifactSource] = useState<{
    project: StudioProject;
    clip: SoundClip | null;
  } | null>(null);
  const filename = useMemo(() => symbolFromTitle(title).toLowerCase(), [title]);
  const currentArtifact =
    artifactSource?.project === project && artifactSource.clip === clip ? artifact : null;

  useEffect(() => () => revokeArtifact(artifact), [artifact]);

  const renderSound = async () => {
    setStatus("rendering");
    setError(null);
    revokeArtifact(artifact);
    setArtifact(null);
    setArtifactSource(null);

    try {
      const finalized = { ...project, title: title.trim() || project.title };
      const decodedClip = clip
        ? { buffer: await decodeAudioBlob(clip.blob), settings: clip }
        : undefined;
      const audio = await renderProjectToWav(finalized, decodedClip);
      const cover = createCoverSvg(finalized);
      const projectFile = new Blob([JSON.stringify({ version: 1, project: finalized }, null, 2)], {
        type: "application/json",
      });
      setArtifact({
        title: finalized.title,
        symbol,
        tempo: finalized.tempo,
        audio,
        cover,
        project: projectFile,
        audioUrl: URL.createObjectURL(audio),
        coverUrl: URL.createObjectURL(cover),
        projectUrl: URL.createObjectURL(projectFile),
      });
      setArtifactSource({ project, clip });
      setStatus("ready");
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : "The sound could not be rendered.");
      setStatus("error");
    }
  };

  return (
    <section className={styles.finishPanel} aria-label="Finish track">
      <div className={styles.finishPanelHeader}>
        <div>
          <span>04 / MASTER</span>
          <h2>FINISH THE SOUND</h2>
        </div>
        <p>Render the canonical loop before any wallet or market action.</p>
      </div>

      <div className={styles.finishFields}>
        <label>
          <span>TRACK TITLE</span>
          <input
            aria-label="Track title"
            maxLength={80}
            value={title}
            onChange={(event) => {
              revokeArtifact(artifact);
              setArtifact(null);
              setArtifactSource(null);
              setStatus("idle");
              setTitle(event.target.value);
              onTitleChange(event.target.value);
            }}
          />
        </label>
        <label>
          <span>FUTURE TICKER</span>
          <input
            aria-label="Token ticker"
            maxLength={10}
            value={symbol}
            onChange={(event) => {
              revokeArtifact(artifact);
              setArtifact(null);
              setArtifactSource(null);
              setStatus("idle");
              setSymbol(symbolFromTitle(event.target.value));
            }}
          />
        </label>
        <button
          type="button"
          className={styles.renderButton}
          disabled={status === "rendering"}
          onClick={() => void renderSound()}
        >
          {status === "rendering" ? "RENDERING…" : "RENDER WAV + COVER"}
        </button>
      </div>

      {error ? <p className={styles.renderError}>{error}</p> : null}

      {currentArtifact ? (
        <div className={styles.artifactPanel} role="status">
          <audio aria-label="Finished track preview" controls src={currentArtifact.audioUrl} />
          <div>
            <strong>MASTER READY</strong>
            <span>{symbol} / WAV + SVG + PROJECT STATE</span>
          </div>
          <nav aria-label="Finished track downloads">
            <a href={currentArtifact.audioUrl} download={`${filename}.wav`}>WAV</a>
            <a href={currentArtifact.coverUrl} download={`${filename}-cover.svg`}>COVER</a>
            <a href={currentArtifact.projectUrl} download={`${filename}.tickerbeat.json`}>PROJECT</a>
          </nav>
        </div>
      ) : null}

      <div className={styles.launchGate}>
        <span>BASE LAUNCH</span>
        <strong>{currentArtifact ? "ARTIFACT VERIFIED LOCALLY" : "WAITING FOR MASTER"}</strong>
        <small>IPFS publication happens before any wallet or market action.</small>
      </div>

      {currentArtifact ? (
        <PublishPanel key={currentArtifact.projectUrl} artifact={currentArtifact} />
      ) : null}
    </section>
  );
}
