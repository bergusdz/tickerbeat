export type TrackId = "drums" | "bass" | "chords" | "lead";
export type InstrumentPreset = 0 | 1 | 2;

export type Step = {
  active: boolean;
  velocity: number;
};

export type Track = {
  id: TrackId;
  label: string;
  color: string;
  note: string | string[];
  instrument: InstrumentPreset;
  filter: number;
  echo: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  steps: Step[];
};

export type StudioProject = {
  title: string;
  tempo: number;
  swing: number;
  tracks: Track[];
};

const STEP_COUNT = 16;

function createSteps(activeSteps: number[]): Step[] {
  const active = new Set(activeSteps);

  return Array.from({ length: STEP_COUNT }, (_, index) => ({
    active: active.has(index),
    velocity: index % 4 === 0 ? 1 : 0.78,
  }));
}

export function createDemoProject(): StudioProject {
  return {
    title: "Acid Broadcast 001",
    tempo: 118,
    swing: 0.12,
    tracks: [
      {
        id: "drums",
        label: "Drums",
        color: "#d9ff43",
        note: "C1",
        instrument: 0,
        filter: 0.86,
        echo: 0.06,
        volume: -4,
        muted: false,
        solo: false,
        steps: createSteps([0, 4, 8, 12]),
      },
      {
        id: "bass",
        label: "Bass",
        color: "#ff5a36",
        note: "F2",
        instrument: 0,
        filter: 0.46,
        echo: 0.14,
        volume: -7,
        muted: false,
        solo: false,
        steps: createSteps([0, 3, 6, 10, 14]),
      },
      {
        id: "chords",
        label: "Chords",
        color: "#69d7ff",
        note: ["F3", "Ab3", "C4"],
        instrument: 0,
        filter: 0.68,
        echo: 0.28,
        volume: -12,
        muted: false,
        solo: false,
        steps: createSteps([2, 6, 10, 14]),
      },
      {
        id: "lead",
        label: "Lead",
        color: "#f4c95d",
        note: "C5",
        instrument: 0,
        filter: 0.74,
        echo: 0.22,
        volume: -13,
        muted: false,
        solo: false,
        steps: createSteps([1, 5, 7, 11, 15]),
      },
    ],
  };
}
