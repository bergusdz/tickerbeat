"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from "react";

import { commit, createHistory, redo, undo, type ProjectHistory } from "./core/history";
import { createDemoProject, type ClipReference, type Track, type TrackId } from "./core/model";
import {
  parseStoredProject,
  LEGACY_PROJECT_STORAGE_KEY,
  PROJECT_STORAGE_KEY,
  VERSION_TWO_PROJECT_STORAGE_KEY,
  serializeProject,
} from "./core/project-storage";
import type { ProjectAction } from "./core/reducer";
import styles from "./studio.module.css";
import { useStudioAudio } from "./use-studio-audio";
import { INSTRUMENT_LABELS } from "./audio/sound-design";
import { SoundClipPanel } from "./recording/sound-clip-panel";
import { useSoundClip } from "./recording/use-sound-clip";
import { FinishPanel } from "./render/finish-panel";

type HistoryAction =
  | { type: "edit"; action: ProjectAction }
  | { type: "restore"; project: ReturnType<typeof createDemoProject> }
  | { type: "undo" }
  | { type: "redo" };

function historyReducer(history: ProjectHistory, action: HistoryAction): ProjectHistory {
  switch (action.type) {
    case "edit":
      return commit(history, action.action);
    case "restore":
      return createHistory(action.project);
    case "undo":
      return undo(history);
    case "redo":
      return redo(history);
  }
}

function TrackStrip({
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
  const trackStyle = { "--track-color": track.color } as CSSProperties;

  return (
    <article className={`${styles.trackStrip} ${selected ? styles.selectedTrack : ""}`} style={trackStyle}>
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
          <small>{track.id === "drums" ? "KICK 909" : track.note.toString()}</small>
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
        <span>VOL</span>
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
        <output>{track.volume}</output>
      </label>
    </article>
  );
}

export function Studio() {
  const [history, dispatch] = useReducer(
    historyReducer,
    undefined,
    () => createHistory(createDemoProject()),
  );
  const [selectedTrack, setSelectedTrack] = useState<TrackId>("drums");
  const [finishOpen, setFinishOpen] = useState(false);
  const draftRestored = useRef(false);
  const project = history.present;
  const updateClipReference = useCallback(
    (value: ClipReference | null) => dispatch({ type: "edit", action: { type: "set-clip", value } }),
    [],
  );
  const soundClip = useSoundClip(project.clip, updateClipReference);
  const { isPlaying, currentStep, togglePlayback } = useStudioAudio(project, soundClip.clip);
  const activeTrack = project.tracks.find((track) => track.id === selectedTrack) ?? project.tracks[0];

  const edit = (action: ProjectAction) => dispatch({ type: "edit", action });

  useEffect(() => {
    const stored = parseStoredProject(
      localStorage.getItem(PROJECT_STORAGE_KEY) ??
        localStorage.getItem(VERSION_TWO_PROJECT_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_PROJECT_STORAGE_KEY),
    );
    queueMicrotask(() => {
      if (stored) dispatch({ type: "restore", project: stored });
      draftRestored.current = true;
      if (!stored) localStorage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
    });
    // The initial project is immutable for this one-time external-store hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (draftRestored.current) localStorage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
  }, [project]);

  return (
    <main className={styles.pageShell}>
      <div className={styles.ambientGrid} aria-hidden="true" />

      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#studio" aria-label="TickerBeat studio home">
          <span className={styles.brandMark} aria-hidden="true">
            TB
          </span>
          <span>
            <strong>TickerBeat</strong>
            <small>BASE AUDIO PROTOCOL / 001</small>
          </span>
        </a>
        <p className={styles.tagline}>MAKE A BEAT <i /> LAUNCH A TICKER</p>
        <div className={styles.networkPill}>
          <span /> BASE
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>BROWSER GROOVEBOX // LIVE MACHINE</p>
          <h1>Sound is the<br /><em>new ticker.</em></h1>
        </div>
        <p className={styles.heroCopy}>
          Build a loop from scratch. Shape it live. When it hits right, finish the sound and
          launch it on Base.
        </p>
      </section>

      <section id="studio" className={styles.machine} aria-label="TickerBeat music studio">
        <span className={`${styles.screw} ${styles.screwA}`} aria-hidden="true" />
        <span className={`${styles.screw} ${styles.screwB}`} aria-hidden="true" />
        <span className={`${styles.screw} ${styles.screwC}`} aria-hidden="true" />
        <span className={`${styles.screw} ${styles.screwD}`} aria-hidden="true" />

        <div className={styles.machineHeader}>
          <div>
            <span className={styles.machineLabel}>TB–01</span>
            <strong>LOOP TOKEN WORKSTATION</strong>
          </div>
          <div className={styles.display}>
            <span>PROJECT</span>
            <strong>{project.title.toUpperCase()}</strong>
          </div>
          <div className={styles.signalCluster} aria-label={isPlaying ? "Transport running" : "Transport stopped"}>
            <span className={isPlaying ? styles.signalLive : ""} />
            <small>{isPlaying ? "RUN" : "IDLE"}</small>
          </div>
        </div>

        <div className={styles.transport}>
          <button
            type="button"
            className={`${styles.playButton} ${isPlaying ? styles.playing : ""}`}
            aria-label={isPlaying ? "Stop beat" : "Play beat"}
            onClick={() => void togglePlayback()}
          >
            <span aria-hidden="true">{isPlaying ? "■" : "▶"}</span>
            {isPlaying ? "STOP" : "PLAY"}
          </button>

          <label className={styles.transportDial}>
            <span>TEMPO</span>
            <output>{project.tempo}</output>
            <small>BPM</small>
            <input
              aria-label="Tempo"
              type="range"
              min="70"
              max="170"
              value={project.tempo}
              onChange={(event) => edit({ type: "set-tempo", value: Number(event.target.value) })}
            />
          </label>

          <label className={styles.transportDial}>
            <span>SWING</span>
            <output>{Math.round(project.swing * 100)}</output>
            <small>%</small>
            <input
              aria-label="Swing"
              type="range"
              min="0"
              max="45"
              value={project.swing * 100}
              onChange={(event) =>
                edit({ type: "set-swing", value: Number(event.target.value) / 100 })
              }
            />
          </label>

          <div className={styles.historyControls}>
            <button
              type="button"
              aria-label="Undo last edit"
              disabled={history.past.length === 0}
              onClick={() => dispatch({ type: "undo" })}
            >
              ↶ <span>UNDO</span>
            </button>
            <button
              type="button"
              aria-label="Redo last edit"
              disabled={history.future.length === 0}
              onClick={() => dispatch({ type: "redo" })}
            >
              ↷ <span>REDO</span>
            </button>
          </div>

          <button
            type="button"
            className={styles.finishButton}
            aria-expanded={finishOpen}
            onClick={() => setFinishOpen((open) => !open)}
          >
            FINISH TRACK <span>↗</span>
          </button>
        </div>

        {finishOpen ? (
          <FinishPanel
            project={project}
            clip={soundClip.clip}
            onTitleChange={(title) => edit({ type: "set-title", value: title })}
          />
        ) : null}

        <div className={styles.workbench}>
          <aside className={styles.mixer} aria-label="Track mixer">
            <div className={styles.sectionHeading}>
              <span>01</span>
              <strong>CHANNELS</strong>
            </div>
            {project.tracks.map((track) => (
              <TrackStrip
                key={track.id}
                track={track}
                selected={track.id === selectedTrack}
                onSelect={() => setSelectedTrack(track.id)}
                onEdit={edit}
              />
            ))}
          </aside>

          <section className={styles.sequencer} aria-label="Step sequencer">
            <div className={styles.sectionHeading}>
              <span>02</span>
              <strong>SEQUENCE / 1 BAR</strong>
              <small>1/16 GRID</small>
            </div>
            <div className={styles.beatNumbers} aria-hidden="true">
              {Array.from({ length: 16 }, (_, index) => (
                <span key={index}>{String(index + 1).padStart(2, "0")}</span>
              ))}
            </div>
            <div className={styles.stepRows}>
              {project.tracks.map((track) => {
                const trackStyle = { "--track-color": track.color } as CSSProperties;
                return (
                  <div className={styles.stepRow} style={trackStyle} key={track.id}>
                    <span className={styles.rowCode}>{track.id.slice(0, 2).toUpperCase()}</span>
                    <div className={styles.stepGrid}>
                      {track.steps.map((step, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`${styles.stepButton} ${step.active ? styles.stepActive : ""} ${
                            step.active && step.velocity >= 0.9 ? styles.stepAccent : ""
                          } ${
                            isPlaying && currentStep === index ? styles.stepCurrent : ""
                          }`}
                          aria-label={`${track.label} step ${index + 1}`}
                          aria-pressed={step.active}
                          onClick={() => edit({ type: "toggle-step", trackId: track.id, step: index })}
                        >
                          <span />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

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
                        edit({ type: "toggle-accent", trackId: activeTrack.id, step: index })
                      }
                    >
                      <span />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.sequenceFooter}>
              <span>ACCENT CHANNEL</span>
              <strong style={{ color: activeTrack.color }}>{activeTrack.label.toUpperCase()}</strong>
              <button
                type="button"
                aria-label={`Clear ${activeTrack.label}`}
                onClick={() => edit({ type: "clear-track", trackId: activeTrack.id })}
              >
                CLEAR PATTERN
              </button>
            </div>
          </section>

          <aside className={styles.performance} aria-label="Performance controls">
            <div className={styles.sectionHeading}>
              <span>03</span>
              <strong>PERFORM</strong>
            </div>
            <section
              className={styles.soundControls}
              aria-label={`${activeTrack.label} sound controls`}
              style={{ "--track-color": activeTrack.color } as CSSProperties}
            >
              <div className={styles.soundControlHeader}>
                <span>SELECTED CHANNEL</span>
                <strong>{activeTrack.label.toUpperCase()}</strong>
              </div>

              <label className={styles.instrumentControl}>
                <span>VOICE</span>
                <select
                  aria-label={`${activeTrack.label} instrument`}
                  value={activeTrack.instrument}
                  onChange={(event) =>
                    edit({
                      type: "set-instrument",
                      trackId: activeTrack.id,
                      value: Number(event.target.value),
                    })
                  }
                >
                  {INSTRUMENT_LABELS[activeTrack.id].map((label, index) => (
                    <option key={label} value={index}>{label}</option>
                  ))}
                </select>
              </label>

              <label className={styles.effectControl}>
                <span>FILTER</span>
                <input
                  aria-label={`${activeTrack.label} filter`}
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(activeTrack.filter * 100)}
                  onChange={(event) =>
                    edit({
                      type: "set-filter",
                      trackId: activeTrack.id,
                      value: Number(event.target.value) / 100,
                    })
                  }
                />
                <output>{Math.round(activeTrack.filter * 100)}</output>
              </label>

              <label className={styles.effectControl}>
                <span>ECHO</span>
                <input
                  aria-label={`${activeTrack.label} echo`}
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(activeTrack.echo * 100)}
                  onChange={(event) =>
                    edit({
                      type: "set-echo",
                      trackId: activeTrack.id,
                      value: Number(event.target.value) / 100,
                    })
                  }
                />
                <output>{Math.round(activeTrack.echo * 100)}</output>
              </label>
            </section>
            <SoundClipPanel control={soundClip} />
            <div className={styles.pads}>
              {[0, 4, 8, 12].map((step, index) => (
                <button
                  key={step}
                  type="button"
                  aria-label={`Toggle ${activeTrack.label} performance pad ${index + 1}`}
                  onClick={() => edit({ type: "toggle-step", trackId: activeTrack.id, step })}
                >
                  <span>PAD {index + 1}</span>
                  <strong>{["HIT", "CUT", "ROLL", "DROP"][index]}</strong>
                </button>
              ))}
            </div>

            <div className={styles.masterPanel}>
              <div>
                <span>MASTER OUT</span>
                <small>{isPlaying ? "-03.8 DB" : "-∞ DB"}</small>
              </div>
              <div className={styles.meter} aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => (
                  <i key={index} className={isPlaying && index < 11 ? styles.meterOn : ""} />
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className={styles.machineFooter}>
          <p><span>●</span> LOCAL DRAFT</p>
          <p>16 STEPS / 4 CHANNELS / {project.tempo} BPM</p>
          <p>NEXT: RENDER → IPFS → BASE TOKEN</p>
        </footer>
      </section>

      <section className={styles.promiseStrip}>
        <span>01 / BUILD</span>
        <strong>Compose before you speculate.</strong>
        <span>02 / LISTEN</span>
        <strong>Every ticker has a sound.</strong>
        <span>03 / LAUNCH</span>
        <strong>One loop. One market.</strong>
      </section>
    </main>
  );
}
