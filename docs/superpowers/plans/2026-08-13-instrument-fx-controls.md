# TickerBeat Instrument and FX Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the approved groovebox scope with selectable channel timbres plus per-channel filter and echo-send controls that affect both live playback and the canonical WAV.

**Architecture:** Extend the existing immutable `Track` model with one bounded preset index and two normalized FX values. Keep parameter mapping pure in a focused sound-design module, reuse those mappings in Tone.js and `OfflineAudioContext`, and expose controls only for the selected channel.

**Tech Stack:** TypeScript, React 19, Tone.js 15, Web Audio API, Vitest, Testing Library, CSS Modules.

---

### Task 1: Extend the canonical project state

**Files:**
- Create: `src/features/studio/audio/sound-design.test.ts`
- Create: `src/features/studio/audio/sound-design.ts`
- Modify: `src/features/studio/core/model.ts`
- Modify: `src/features/studio/core/reducer.test.ts`
- Modify: `src/features/studio/core/reducer.ts`
- Modify: `src/features/studio/core/project-storage.test.ts`
- Modify: `src/features/studio/core/project-storage.ts`

- [ ] Add failing tests proving that each track exposes exactly three compatible preset labels, cutoff maps monotonically into an audible 180–12,000 Hz range, and normalized FX values clamp to 0–1.
- [ ] Add `instrument: 0 | 1 | 2`, `filter: number`, and `echo: number` to `Track`, with musical defaults in `createDemoProject()`.
- [ ] Add immutable `set-instrument`, `set-filter`, and `set-echo` reducer actions; reject invalid preset indices and clamp normalized values.
- [ ] Upgrade storage to version 2 and migrate valid version-1 drafts by applying the new channel defaults without losing patterns or mixer state.
- [ ] Run `pnpm test src/features/studio/audio/sound-design.test.ts src/features/studio/core/reducer.test.ts src/features/studio/core/project-storage.test.ts` and require all tests to pass.

### Task 2: Apply the same sound design live and offline

**Files:**
- Modify: `src/features/studio/audio/tone-engine.ts`
- Modify: `src/features/studio/audio/tone-engine.test.ts`
- Modify: `src/features/studio/render/render-project.ts`
- Modify: `src/features/studio/render/render-project.test.ts`

- [ ] Add failing unit tests for preset-to-waveform/drum mappings and normalized cutoff/send conversion.
- [ ] Route each Tone instrument through its own filter, dry volume, and send gain into the existing delay and limiter; update parameters from project state without restarting transport.
- [ ] Build equivalent per-track Web Audio filter/send nodes in offline rendering and select the same oscillator/drum characteristics.
- [ ] Run focused audio and render tests and require all tests to pass.

### Task 3: Add selected-channel hardware controls

**Files:**
- Modify: `src/features/studio/studio.tsx`
- Modify: `src/features/studio/studio.module.css`
- Modify: `src/features/studio/studio.test.tsx`

- [ ] Add failing component tests that select a channel, change its instrument, filter, and echo, and verify the controls update only that channel through undoable project actions.
- [ ] Add a compact `VOICE / FILTER / ECHO` bank above the performance pads. Use a native select and two range inputs with visible numeric outputs and existing industrial styling.
- [ ] Preserve the current mobile single-column layout and visible focus treatment.
- [ ] Run the component test and require it to pass.

### Task 4: Verify and publish the increment

**Files:**
- Modify only files required by verification failures.

- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`; all must exit 0.
- [ ] Verify in a real browser that changing voice/cutoff/echo during playback remains responsive, the rendered master invalidates after an edit, and no mobile overflow appears.
- [ ] Stage only this plan and instrument/FX implementation, preserving the user's unrelated README and research files.
- [ ] Commit, push the existing branch, deploy production, and verify `https://tickerbeat.vercel.app`.
