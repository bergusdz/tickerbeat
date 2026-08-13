import type { CSSProperties } from "react";

import type { StudioProject, Track, TrackId } from "../core/model";
import type { ProjectAction } from "../core/reducer";
import styles from "./step-grid.module.css";

function ChannelButton({
  track,
  selected,
  onSelect,
}: {
  track: Track;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={selected ? styles.selectedChannel : undefined}
      style={{ "--track-color": track.color } as CSSProperties}
      aria-label={`Select ${track.label} track`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span>{track.id.slice(0, 2).toUpperCase()}</span>
      <strong>{track.label}</strong>
      <small>{track.muted ? "Muted" : track.solo ? "Solo" : "Ready"}</small>
    </button>
  );
}

export function StepGrid({
  project,
  selectedTrack,
  currentStep,
  isPlaying,
  onSelectTrack,
  onEdit,
}: {
  project: StudioProject;
  selectedTrack: TrackId;
  currentStep: number;
  isPlaying: boolean;
  onSelectTrack: (trackId: TrackId) => void;
  onEdit: (action: ProjectAction) => void;
}) {
  const activeTrack =
    project.tracks.find((track) => track.id === selectedTrack) ?? project.tracks[0];

  return (
    <section className={styles.sequencer} aria-label="Step sequencer">
      <header className={styles.sectionHeading}>
        <div>
          <span>Pattern A / 01</span>
          <strong>THE TICKER TAPE</strong>
        </div>
        <small>1 BAR · 16 STEPS · CLICK TO ARM</small>
      </header>

      <div className={styles.channelRail} aria-label="Instrument channels">
        {project.tracks.map((track) => (
          <ChannelButton
            key={track.id}
            track={track}
            selected={track.id === selectedTrack}
            onSelect={() => onSelectTrack(track.id)}
          />
        ))}
      </div>

      <div className={styles.gridViewport}>
        <div className={styles.beatNumbers} aria-hidden="true">
          <span />
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index}>{String(index + 1).padStart(2, "0")}</span>
          ))}
        </div>

        <div className={styles.stepRows}>
          {project.tracks.map((track) => (
            <div
              className={styles.stepRow}
              style={{ "--track-color": track.color } as CSSProperties}
              key={track.id}
            >
              <button
                type="button"
                className={styles.rowCode}
                aria-label={`Select ${track.label} row`}
                aria-pressed={track.id === selectedTrack}
                onClick={() => onSelectTrack(track.id)}
              >
                {track.id.slice(0, 2).toUpperCase()}
              </button>
              <div className={styles.stepGrid}>
                {track.steps.map((step, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.stepButton} ${step.active ? styles.stepActive : ""} ${
                      step.active && step.velocity >= 0.9 ? styles.stepAccent : ""
                    } ${isPlaying && currentStep === index ? styles.stepCurrent : ""}`}
                    aria-label={`${track.label} step ${index + 1}`}
                    aria-pressed={step.active}
                    onClick={() =>
                      onEdit({ type: "toggle-step", trackId: track.id, step: index })
                    }
                  >
                    <span />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div
            className={styles.accentLane}
            style={{ "--track-color": activeTrack.color } as CSSProperties}
          >
            <span className={styles.rowCode}>AC</span>
            <div className={styles.accentGrid}>
              {activeTrack.steps.map((step, index) => {
                const accented = step.active && step.velocity >= 0.9;
                return (
                  <button
                    key={index}
                    type="button"
                    aria-label={`${activeTrack.label} accent step ${index + 1}`}
                    aria-pressed={accented}
                    disabled={!step.active}
                    className={accented ? styles.accentActive : ""}
                    onClick={() =>
                      onEdit({ type: "toggle-accent", trackId: activeTrack.id, step: index })
                    }
                  >
                    <span />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.sequenceFooter}>
        <p>
          Accent lane: <strong style={{ color: activeTrack.color }}>{activeTrack.label}</strong>
        </p>
        <button
          type="button"
          aria-label={`Clear ${activeTrack.label}`}
          onClick={() => onEdit({ type: "clear-track", trackId: activeTrack.id })}
        >
          Clear selected pattern
        </button>
      </footer>
    </section>
  );
}
