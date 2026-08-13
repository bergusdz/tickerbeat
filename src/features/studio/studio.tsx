"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Workspace } from "../workspace/workspace";
import { Mixer } from "./components/mixer";
import { StepGrid } from "./components/step-grid";
import { Transport } from "./components/transport";
import { commit, createHistory, redo, undo, type ProjectHistory } from "./core/history";
import { createDemoProject, type ClipReference, type TrackId } from "./core/model";
import {
  LEGACY_PROJECT_STORAGE_KEY,
  PROJECT_STORAGE_KEY,
  VERSION_TWO_PROJECT_STORAGE_KEY,
  parseStoredProject,
  serializeProject,
} from "./core/project-storage";
import type { ProjectAction } from "./core/reducer";
import { useSoundClip } from "./recording/use-sound-clip";
import { FinishPanel } from "./render/finish-panel";
import styles from "./studio.module.css";
import { useStudioAudio } from "./use-studio-audio";

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
function EmptyBoard() {
  return (
    <section className={styles.boardPlaceholder} aria-label="Release board">
      <span>LIVE ON BASE / CLANKER V4</span>
      <strong>THE FIRST SLOT IS OPEN.</strong>
      <p>Confirmed TickerBeat releases appear here with playable audio and Base links.</p>
    </section>
  );
}

export function Studio({ board }: { board?: ReactNode }) {
  const [history, dispatch] = useReducer(
    historyReducer,
    undefined,
    () => createHistory(createDemoProject()),
  );
  const [selectedTrack, setSelectedTrack] = useState<TrackId>("drums");
  const draftRestored = useRef(false);
  const project = history.present;
  const updateClipReference = useCallback(
    (value: ClipReference | null) =>
      dispatch({ type: "edit", action: { type: "set-clip", value } }),
    [],
  );
  const soundClip = useSoundClip(project.clip, updateClipReference);
  const { isPlaying, currentStep, togglePlayback } = useStudioAudio(project, soundClip.clip);

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
    if (draftRestored.current) {
      localStorage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
    }
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
            <small>BASE AUDIO INSTRUMENT / 001</small>
          </span>
        </a>
        <p className={styles.tagline}>MAKE SOUND <i /> MAKE MARKET</p>
        <div className={styles.networkPill}>
          <span /> BASE
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>BROWSER DJ DESK · NO DOWNLOAD · LIVE MACHINE</p>
          <h1>
            YOUR SOUND.
            <br />
            <em>YOUR TICKER.</em>
          </h1>
        </div>
        <div className={styles.heroCopy}>
          <strong>01: MAKE THE LOOP</strong>
          <p>Tap a pattern, shape the signal, record anything. Release only when it sounds right.</p>
        </div>
      </section>

      <section id="studio" className={styles.machine} aria-label="TickerBeat music studio">
        <div className={styles.machineHeader}>
          <div>
            <span className={styles.machineLabel}>TB–01</span>
            <strong>LOOP TOKEN WORKSTATION</strong>
          </div>
          <div className={styles.display}>
            <span>NOW EDITING</span>
            <strong>{project.title.toUpperCase()}</strong>
          </div>
          <div
            className={styles.signalCluster}
            aria-label={isPlaying ? "Transport running" : "Transport stopped"}
          >
            <span className={isPlaying ? styles.signalLive : ""} />
            <small>{isPlaying ? "SIGNAL LIVE" : "ENGINE IDLE"}</small>
          </div>
        </div>

        <Workspace
          panels={{
            make: (
              <div className={styles.makeStage}>
                <Transport
                  project={project}
                  isPlaying={isPlaying}
                  canUndo={history.past.length > 0}
                  canRedo={history.future.length > 0}
                  onTogglePlayback={() => void togglePlayback()}
                  onEdit={edit}
                  onUndo={() => dispatch({ type: "undo" })}
                  onRedo={() => dispatch({ type: "redo" })}
                />
                <StepGrid
                  project={project}
                  selectedTrack={selectedTrack}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  onSelectTrack={setSelectedTrack}
                  onEdit={edit}
                />
              </div>
            ),
            mix: (
              <Mixer
                project={project}
                selectedTrack={selectedTrack}
                isPlaying={isPlaying}
                clipControl={soundClip}
                onSelectTrack={setSelectedTrack}
                onEdit={edit}
              />
            ),
            finish: (
              <FinishPanel
                project={project}
                clip={soundClip.clip}
                onTitleChange={(title) => edit({ type: "set-title", value: title })}
              />
            ),
            board: board ?? <EmptyBoard />,
          }}
        />

        <footer className={styles.machineFooter}>
          <p>
            <span>●</span> LOCAL DRAFT
          </p>
          <p>16 STEPS / 4 CHANNELS / {project.tempo} BPM</p>
          <p>RENDER → IPFS → BASE</p>
        </footer>
      </section>

      <section className={styles.promiseStrip} aria-label="TickerBeat principles">
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
