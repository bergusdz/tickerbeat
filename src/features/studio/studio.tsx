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
      <span>No confirmed releases yet</span>
      <strong>The first slot is open.</strong>
      <p>Finish a loop, publish it, then launch on Base. Confirmed releases appear here with playable audio.</p>
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
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#studio" aria-label="TickerBeat studio home">
          <span className={styles.brandMark} aria-hidden="true">
            TB
          </span>
          <span>
            <strong>TickerBeat</strong>
            <small>Make sound. Make market.</small>
          </span>
        </a>
        <p
          className={styles.nowPlaying}
          aria-label={isPlaying ? "Transport running" : "Transport stopped"}
        >
          <span className={isPlaying ? styles.signalLive : styles.signalIdle} />
          <strong>{project.title.toUpperCase()}</strong>
          <small>{project.tempo} BPM</small>
        </p>
      </header>

      <section id="studio" className={styles.machine} aria-label="TickerBeat music studio">
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

        <Workspace
          panels={{
            make: (
              <div className={styles.makeStage}>
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
            <span aria-hidden="true">●</span> Local draft
          </p>
          <p>
            {project.tracks.length} tracks · 16 steps · {project.tempo} BPM
          </p>
          <p>Render, then publish, then launch</p>
        </footer>
      </section>
    </main>
  );
}
