import type { StudioProject } from "../core/model";
import type { ProjectAction } from "../core/reducer";
import styles from "../studio.module.css";

export function Transport({
  project,
  isPlaying,
  canUndo,
  canRedo,
  onTogglePlayback,
  onEdit,
  onUndo,
  onRedo,
}: {
  project: StudioProject;
  isPlaying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onTogglePlayback: () => void;
  onEdit: (action: ProjectAction) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <section className={styles.transport} aria-label="Transport controls">
      <button
        type="button"
        className={`${styles.playButton} ${isPlaying ? styles.playing : ""}`}
        aria-label={isPlaying ? "Stop beat" : "Play beat"}
        onClick={onTogglePlayback}
      >
        <span aria-hidden="true">{isPlaying ? "■" : "▶"}</span>
        <strong>{isPlaying ? "Stop" : "Play"}</strong>
        <small>{isPlaying ? "Engine running" : "Hear the loop"}</small>
      </button>

      <label className={styles.transportDial}>
        <span>Tempo</span>
        <output>{project.tempo}</output>
        <small>BPM</small>
        <input
          aria-label="Tempo"
          type="range"
          min="70"
          max="170"
          value={project.tempo}
          onChange={(event) =>
            onEdit({ type: "set-tempo", value: Number(event.target.value) })
          }
        />
      </label>

      <label className={styles.transportDial}>
        <span>Swing</span>
        <output>{Math.round(project.swing * 100)}</output>
        <small>%</small>
        <input
          aria-label="Swing"
          type="range"
          min="0"
          max="45"
          value={project.swing * 100}
          onChange={(event) =>
            onEdit({ type: "set-swing", value: Number(event.target.value) / 100 })
          }
        />
      </label>

      <div className={styles.historyControls} aria-label="Edit history">
        <button type="button" aria-label="Undo last edit" disabled={!canUndo} onClick={onUndo}>
          <span aria-hidden="true">↶</span>
          Undo
        </button>
        <button type="button" aria-label="Redo last edit" disabled={!canRedo} onClick={onRedo}>
          <span aria-hidden="true">↷</span>
          Redo
        </button>
      </div>
    </section>
  );
}

