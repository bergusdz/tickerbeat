# Playable TickerBeat Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first working TickerBeat vertical slice: a polished browser DJ desk with four deterministic tracks, a 16-step sequencer, live Tone.js playback, tempo/swing/mixer controls, undo/redo, and responsive presentation.

**Architecture:** Use one Next.js App Router application. Keep project state and scheduling pure under `src/features/studio/core`, place Tone.js behind a client-only engine adapter, and let React own only interaction and presentation. This slice intentionally contains no wallet, IPFS, database, or token-launch code.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tone.js 15, Vitest 4, Testing Library, CSS Modules/global CSS, pnpm.

---

## File map

- `package.json` — pinned runtime, scripts, and test dependencies.
- `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts` — build and quality configuration.
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — application entry and visual system.
- `src/features/studio/core/model.ts` — canonical project types and initial demo groove.
- `src/features/studio/core/reducer.ts` — bounded project commands.
- `src/features/studio/core/history.ts` — undo/redo state transitions.
- `src/features/studio/core/schedule.ts` — pure conversion of project state into per-step musical events.
- `src/features/studio/audio/tone-engine.ts` — client-only Tone.js nodes and transport lifecycle.
- `src/features/studio/use-studio-audio.ts` — React lifecycle adapter for the engine.
- `src/features/studio/studio.tsx` — complete interactive instrument.
- `src/features/studio/studio.module.css` — industrial sampler/DJ-desk presentation.
- `src/features/studio/**/*.test.ts(x)` — behavior-first tests.

### Task 1: Bootstrap the application and quality gates

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Add the minimal package manifest**

Use exact pinned runtime versions and caret ranges only for type/test tooling:

```json
{
  "name": "tickerbeat",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.19.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "tone": "15.1.22"
  },
  "devDependencies": {
    "@testing-library/dom": "10.4.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^26.2.0",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "eslint": "9.39.5",
    "eslint-config-next": "16.3.0",
    "jsdom": "30.0.1",
    "typescript": "6.0.3",
    "vitest": "4.1.10"
  }
}
```

Add `pnpm-workspace.yaml` with an explicit `allowBuilds` entry for
`unrs-resolver`; do not enable dependency build scripts globally.

- [ ] **Step 2: Add TypeScript, Next, ESLint, and Vitest configuration**

Configure strict TypeScript with the `@/* -> ./src/*` alias, Next's App Router
plugin, flat ESLint config from `eslint-config-next/core-web-vitals`, and a
jsdom Vitest environment loading `src/test/setup.ts`. The setup file imports
`@testing-library/jest-dom/vitest`.

- [ ] **Step 3: Add the initial App Router shell**

`layout.tsx` loads `Unbounded` for display type and `IBM_Plex_Mono` for controls
through `next/font/google`, exports TickerBeat metadata, and applies both font
variables to `<body>`. `page.tsx` renders a temporary `<main>TickerBeat</main>`.
`globals.css` defines border-box sizing, a near-black canvas, acid-lime accent,
off-white text, and reduced-motion behavior.

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`

Expected: lockfile created and install exits 0 without peer dependency errors.

- [ ] **Step 5: Verify the empty shell**

Run: `pnpm typecheck && pnpm lint && pnpm build`

Expected: all commands exit 0.

### Task 2: Build the canonical groove state with TDD

**Files:**
- Create: `src/features/studio/core/model.test.ts`
- Create: `src/features/studio/core/model.ts`
- Create: `src/features/studio/core/reducer.test.ts`
- Create: `src/features/studio/core/reducer.ts`

- [ ] **Step 1: Write a failing initial-project test**

Test that `createDemoProject()` returns exactly four tracks in the order
`drums`, `bass`, `chords`, `lead`; every track has 16 steps; tempo is 118; swing
is 0.12; and a second call returns independent arrays.

- [ ] **Step 2: Run the model test and observe RED**

Run: `pnpm test src/features/studio/core/model.test.ts`

Expected: FAIL because `model.ts` does not exist.

- [ ] **Step 3: Implement the minimal model**

Define:

```ts
export type TrackId = "drums" | "bass" | "chords" | "lead";
export type Step = { active: boolean; velocity: number };
export type Track = {
  id: TrackId;
  label: string;
  color: string;
  note: string | string[];
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
```

`createDemoProject()` builds fresh arrays and a musically useful demo pattern:
four-on-the-floor drums, syncopated bass, off-beat chords, and a sparse lead.

- [ ] **Step 4: Run the model test and observe GREEN**

Run: `pnpm test src/features/studio/core/model.test.ts`

Expected: one test file passes.

- [ ] **Step 5: Write failing reducer tests**

Cover one behavior per test:

- toggle a step without mutating the previous project;
- clamp tempo to 70–170 BPM;
- clamp swing to 0–0.45;
- clamp volume to -36–6 dB;
- mute and solo the selected track only;
- clear the selected track while preserving mixer settings.

- [ ] **Step 6: Run the reducer tests and observe RED**

Run: `pnpm test src/features/studio/core/reducer.test.ts`

Expected: FAIL because `reduceProject` is missing.

- [ ] **Step 7: Implement bounded project actions**

Use this closed action union:

```ts
export type ProjectAction =
  | { type: "toggle-step"; trackId: TrackId; step: number }
  | { type: "set-tempo"; value: number }
  | { type: "set-swing"; value: number }
  | { type: "set-volume"; trackId: TrackId; value: number }
  | { type: "toggle-mute"; trackId: TrackId }
  | { type: "toggle-solo"; trackId: TrackId }
  | { type: "clear-track"; trackId: TrackId };
```

Reject invalid step indices by returning the original project. For valid
actions, copy only the changed project/track/step path.

- [ ] **Step 8: Run all core tests and observe GREEN**

Run: `pnpm test src/features/studio/core/model.test.ts src/features/studio/core/reducer.test.ts`

Expected: all model and reducer tests pass.

### Task 3: Add undo and redo with TDD

**Files:**
- Create: `src/features/studio/core/history.test.ts`
- Create: `src/features/studio/core/history.ts`

- [ ] **Step 1: Write failing history tests**

Test that a committed toggle creates one past entry, undo restores byte-equal
state and creates a future entry, redo restores the edit, a new edit clears the
future, and no-op actions do not create history.

- [ ] **Step 2: Run the history tests and observe RED**

Run: `pnpm test src/features/studio/core/history.test.ts`

Expected: FAIL because history helpers do not exist.

- [ ] **Step 3: Implement immutable history transitions**

Define `ProjectHistory` as `{ past: StudioProject[]; present: StudioProject;
future: StudioProject[] }` and export `createHistory`, `commit`, `undo`, and
`redo`. Cap `past` at 50 entries.

- [ ] **Step 4: Run the history tests and observe GREEN**

Run: `pnpm test src/features/studio/core/history.test.ts`

Expected: all history tests pass.

### Task 4: Build deterministic scheduling and the Tone.js adapter

**Files:**
- Create: `src/features/studio/core/schedule.test.ts`
- Create: `src/features/studio/core/schedule.ts`
- Create: `src/features/studio/audio/tone-engine.ts`
- Create: `src/features/studio/use-studio-audio.ts`

- [ ] **Step 1: Write failing schedule tests**

Test that `eventsAtStep(project, 0)` returns active, audible tracks; muted tracks
are excluded; when any track is soloed only solo tracks are returned; inactive
steps are excluded; and step indices wrap modulo 16.

- [ ] **Step 2: Run schedule tests and observe RED**

Run: `pnpm test src/features/studio/core/schedule.test.ts`

Expected: FAIL because `eventsAtStep` is missing.

- [ ] **Step 3: Implement the pure event planner**

Return events shaped as `{ trackId, note, velocity }`. Determine audible tracks
from solo state first and never read time or browser APIs.

- [ ] **Step 4: Run schedule tests and observe GREEN**

Run: `pnpm test src/features/studio/core/schedule.test.ts`

Expected: all scheduling tests pass.

- [ ] **Step 5: Implement the client-only Tone engine**

Create one engine with `start(project)`, `stop()`, `update(project)`, and
`dispose()`. Dynamically import Tone.js on the first user gesture. Use
`getTransport()` with a `scheduleRepeat(..., "16n")` callback and `Draw.schedule`
to publish the visible playhead. Use a `MembraneSynth` for drums, `MonoSynth`
for bass, `PolySynth` for chords, and `Synth` for lead. Route each instrument
through its own `Volume` node and a small shared `FeedbackDelay`, then a limiter.
Set transport BPM and swing from project state. Dispose every node and clear the
scheduled event during teardown.

- [ ] **Step 6: Add the React lifecycle hook**

`useStudioAudio(project)` owns one engine in a ref and returns `{ isPlaying,
currentStep, togglePlayback }`. It calls `update` when project state changes and
disposes the engine on unmount. Playback errors return the UI to stopped state
instead of leaving a false active transport.

- [ ] **Step 7: Verify types and core tests**

Run: `pnpm typecheck && pnpm test`

Expected: both commands exit 0.

### Task 5: Build the distinctive interactive DJ desk with TDD

**Files:**
- Create: `src/features/studio/studio.test.tsx`
- Create: `src/features/studio/studio.tsx`
- Create: `src/features/studio/studio.module.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing interaction tests**

Mock only `useStudioAudio`. Render `Studio` and verify:

- four named track rows are present;
- clicking a step toggles `aria-pressed`;
- tempo input updates the displayed BPM;
- clear removes active steps from the active track;
- undo restores the cleared pattern;
- the transport button calls `togglePlayback`.

- [ ] **Step 2: Run the component test and observe RED**

Run: `pnpm test src/features/studio/studio.test.tsx`

Expected: FAIL because `Studio` does not exist.

- [ ] **Step 3: Implement the studio component**

Use semantic buttons and range inputs. Keep a selected track ID in local UI
state and project history in a reducer. The layout contains:

- a compact brand/header with **MAKE A BEAT / LAUNCH A TICKER**;
- a top transport strip with play, BPM, swing, undo, redo, and finish-track;
- a left deck with four track selector/mixer channels;
- a central 4×16 sequencer with quarter-note separators and live playhead;
- a right performance panel with four large pads and a master output meter;
- a bottom status rail explaining that token launch comes after finishing the
  sound, without exposing non-working wallet controls.

- [ ] **Step 4: Apply the visual direction**

Use an industrial live-hardware aesthetic: warm graphite panels, off-white
screen typography, acid-lime active controls, vermilion recording accents,
visible screw details, narrow mono labels, subtle diagonal grille texture, and
hard mechanical shadows. Avoid purple gradients, glass cards, generic dashboard
spacing, and ornamental animations. Add a single coordinated entrance motion
and tactile button depression. Maintain WCAG-visible focus states and a useful
single-column mobile layout.

- [ ] **Step 5: Run component and full tests and observe GREEN**

Run: `pnpm test`

Expected: all test files pass.

### Task 6: Verify the first vertical slice

**Files:**
- Modify only files required by failures found in verification.

- [ ] **Step 1: Run automated quality gates**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Expected: every command exits 0 with no test failures or lint/type errors.

- [ ] **Step 2: Run the app and inspect it in a real browser**

Run: `pnpm dev`

Verify at desktop and mobile widths:

- audio starts only after pressing play;
- playhead advances through all 16 steps;
- active steps can be changed during playback;
- mute, solo, volume, tempo, and swing visibly and audibly respond;
- stop resets the playhead;
- undo/redo works;
- no horizontal overflow or illegible controls appear at 390px width;
- browser console has no runtime errors.

- [ ] **Step 3: Inspect repository safety**

Run: `git diff --check`, `git status --short`, and a secret-pattern scan over
tracked/untracked project files excluding `.git` and `node_modules`.

Expected: no whitespace errors, credentials, private keys, or generated build
artifacts are staged.

- [ ] **Step 4: Commit only the first-slice implementation**

Stage the application files, this plan, and the new MVP design. Preserve
unrelated pre-existing user changes unless they are intentionally superseded.
Commit message: `feat: build the playable TickerBeat studio`.
