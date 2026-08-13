import type { CSSProperties } from "react";

import { INSTRUMENT_LABELS } from "../audio/sound-design";
import type { StudioProject, Track, TrackId } from "../core/model";
import type { ProjectAction } from "../core/reducer";
import type { SoundClipController } from "../recording/types";
import styles from "./mixer.module.css";
import { ClipDeck } from "./clip-deck";

function ChannelStrip({
  track,
  selected,
  onSelect,
  onEdit,
}: {
  track: Track;
  selected: boolean;
  onSelect: () => void;
  onEdit: (action: ProjectAction) => void;
}) {
  return (
    <article
      className={`${styles.trackStrip} ${selected ? styles.selectedTrack : ""}`}
      style={{ "--track-color": track.color } as CSSProperties}
    >
      <button
        type="button"
        className={styles.trackSelect}
        aria-label={`Select ${track.label} track`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span className={styles.trackLed} />
        <span>
          <strong>{track.label}</strong>
          <small>{track.id === "drums" ? "DRUM BUS" : track.note.toString()}</small>
        </span>
      </button>

      <div className={styles.trackButtons}>
        <button
          type="button"
          className={track.muted ? styles.controlOn : ""}
          aria-label={`Mute ${track.label}`}
          aria-pressed={track.muted}
          onClick={() => onEdit({ type: "toggle-mute", trackId: track.id })}
        >
          M
        </button>
        <button
          type="button"
          className={track.solo ? styles.controlOn : ""}
          aria-label={`Solo ${track.label}`}
          aria-pressed={track.solo}
          onClick={() => onEdit({ type: "toggle-solo", trackId: track.id })}
        >
          S
        </button>
      </div>

      <label className={styles.volumeControl}>
        <span>Volume</span>
        <input
          aria-label={`${track.label} volume`}
          type="range"
          min="-36"
          max="6"
          step="1"
          value={track.volume}
          onChange={(event) =>
            onEdit({
              type: "set-volume",
              trackId: track.id,
              value: Number(event.target.value),
            })
          }
        />
        <output>{track.volume} dB</output>
      </label>
    </article>
  );
}

export function Mixer({
  project,
  selectedTrack,
  isPlaying,
  clipControl,
  onSelectTrack,
  onEdit,
}: {
  project: StudioProject;
  selectedTrack: TrackId;
  isPlaying: boolean;
  clipControl: SoundClipController;
  onSelectTrack: (trackId: TrackId) => void;
  onEdit: (action: ProjectAction) => void;
}) {
  const activeTrack =
    project.tracks.find((track) => track.id === selectedTrack) ?? project.tracks[0];

  return (
    <div className={styles.mixStage}>
      <section className={styles.mixer} aria-label="Track mixer">
        <header className={styles.sectionHeading}>
          <div>
            <span>Desk A / four channels</span>
            <strong>LEVELS</strong>
          </div>
          <small>MUTE · SOLO · GAIN</small>
        </header>
        <div className={styles.channelStrips}>
          {project.tracks.map((track) => (
            <ChannelStrip
              key={track.id}
              track={track}
              selected={track.id === selectedTrack}
              onSelect={() => onSelectTrack(track.id)}
              onEdit={onEdit}
            />
          ))}
        </div>
      </section>

      <section className={styles.performance} aria-label="Performance controls">
        <header className={styles.sectionHeading}>
          <div>
            <span>Channel edit / {activeTrack.id}</span>
            <strong>SHAPE {activeTrack.label.toUpperCase()}</strong>
          </div>
          <small>VOICE · FILTER · ECHO</small>
        </header>

        <div
          className={styles.soundControls}
          aria-label={`${activeTrack.label} sound controls`}
          style={{ "--track-color": activeTrack.color } as CSSProperties}
        >
          <label className={styles.instrumentControl}>
            <span>Voice</span>
            <select
              aria-label={`${activeTrack.label} instrument`}
              value={activeTrack.instrument}
              onChange={(event) =>
                onEdit({
                  type: "set-instrument",
                  trackId: activeTrack.id,
                  value: Number(event.target.value),
                })
              }
            >
              {INSTRUMENT_LABELS[activeTrack.id].map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.effectControl}>
            <span>Filter</span>
            <input
              aria-label={`${activeTrack.label} filter`}
              type="range"
              min="0"
              max="100"
              value={Math.round(activeTrack.filter * 100)}
              onChange={(event) =>
                onEdit({
                  type: "set-filter",
                  trackId: activeTrack.id,
                  value: Number(event.target.value) / 100,
                })
              }
            />
            <output>{Math.round(activeTrack.filter * 100)}</output>
          </label>

          <label className={styles.effectControl}>
            <span>Echo</span>
            <input
              aria-label={`${activeTrack.label} echo`}
              type="range"
              min="0"
              max="100"
              value={Math.round(activeTrack.echo * 100)}
              onChange={(event) =>
                onEdit({
                  type: "set-echo",
                  trackId: activeTrack.id,
                  value: Number(event.target.value) / 100,
                })
              }
            />
            <output>{Math.round(activeTrack.echo * 100)}</output>
          </label>
        </div>

        <div className={styles.pads} aria-label="Performance pads">
          {[0, 4, 8, 12].map((step, index) => (
            <button
              key={step}
              type="button"
              aria-label={`Toggle ${activeTrack.label} performance pad ${index + 1}`}
              onClick={() =>
                onEdit({ type: "toggle-step", trackId: activeTrack.id, step })
              }
            >
              <span>0{index + 1}</span>
              <strong>{["Hit", "Cut", "Roll", "Drop"][index]}</strong>
            </button>
          ))}
        </div>

        <div className={styles.masterPanel}>
          <div>
            <span>Master out</span>
            <small>{isPlaying ? "-03.8 dB" : "-∞ dB"}</small>
          </div>
          <div className={styles.meter} aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <i key={index} className={isPlaying && index < 11 ? styles.meterOn : ""} />
            ))}
          </div>
        </div>
      </section>

      <ClipDeck control={clipControl} />
    </div>
  );
}
