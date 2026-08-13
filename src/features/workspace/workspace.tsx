"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import styles from "./workspace.module.css";

export type WorkspaceStage = "make" | "mix" | "finish" | "board";

type WorkspacePanels = Record<WorkspaceStage, ReactNode>;

const STAGES: ReadonlyArray<{
  id: WorkspaceStage;
  index: string;
  label: string;
  detail: string;
}> = [
  { id: "make", index: "01", label: "Make", detail: "Sequence" },
  { id: "mix", index: "02", label: "Mix", detail: "Shape" },
  { id: "finish", index: "03", label: "Finish", detail: "Release" },
  { id: "board", index: "04", label: "Board", detail: "Discover" },
];

export function Workspace({ panels }: { panels: WorkspacePanels }) {
  const [activeStage, setActiveStage] = useState<WorkspaceStage>("make");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectStage = (index: number) => {
    const stage = STAGES[index];
    if (!stage) return;
    setActiveStage(stage.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % STAGES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + STAGES.length) % STAGES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = STAGES.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      selectStage(nextIndex);
    }
  };

  return (
    <div className={styles.workspace}>
      <div className={styles.stageRail} role="tablist" aria-label="TickerBeat workflow">
        {STAGES.map((stage, index) => {
          const selected = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`workspace-tab-${stage.id}`}
              type="button"
              role="tab"
              aria-label={stage.label}
              aria-controls={`workspace-panel-${stage.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={selected ? styles.activeStage : undefined}
              onClick={() => setActiveStage(stage.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span>{stage.index}</span>
              <strong>{stage.label}</strong>
              <small>{stage.detail}</small>
            </button>
          );
        })}
      </div>

      <div className={styles.panelStack}>
        {STAGES.map((stage) => (
          <section
            key={stage.id}
            id={`workspace-panel-${stage.id}`}
            role="tabpanel"
            aria-labelledby={`workspace-tab-${stage.id}`}
            aria-label={stage.label}
            hidden={activeStage !== stage.id}
            className={styles.stagePanel}
          >
            {panels[stage.id]}
          </section>
        ))}
      </div>
    </div>
  );
}
