# Sample Clip Transport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an imported or microphone-recorded clip part of the same live loop and canonical WAV, with bounded trim and level controls.

**Architecture:** Keep binary clip data outside `StudioProject`, but attach normalized playback settings to `SoundClip`. A pure helper converts normalized trim into seconds for both Tone.js live playback and Web Audio offline rendering, preventing preview/master drift. The existing one-bar transport triggers the clip at step zero and stops it with the transport.

**Tech Stack:** React 19, TypeScript, Tone.js, Web Audio API, Vitest, Testing Library.

---

### Task 1: Canonical clip settings and playback window

**Files:**
- Create: `src/features/studio/recording/clip-playback.ts`
- Create: `src/features/studio/recording/clip-playback.test.ts`
- Modify: `src/features/studio/recording/use-sound-clip.ts`
- Modify: `src/features/studio/recording/use-sound-clip.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
expect(clipPlaybackWindow(10, { trimStart: 0.2, trimEnd: 0.8, level: 0.5 }, 4))
  .toEqual({ offset: 2, duration: 4, gain: 0.5 });
expect(updateClipSettings(clip, { trimStart: 0.9 })).toMatchObject({ trimStart: 0.9, trimEnd: 0.91 });
```

- [ ] **Step 2: Run RED**

Run: `pnpm test src/features/studio/recording/clip-playback.test.ts src/features/studio/recording/use-sound-clip.test.ts`

Expected: FAIL because `clipPlaybackWindow` and settings updates do not exist.

- [ ] **Step 3: Implement bounded settings**

```ts
export type ClipPlaybackSettings = { trimStart: number; trimEnd: number; level: number };

export function clipPlaybackWindow(sourceDuration: number, settings: ClipPlaybackSettings, maxDuration: number) {
  const offset = sourceDuration * settings.trimStart;
  const duration = Math.min(sourceDuration * (settings.trimEnd - settings.trimStart), maxDuration);
  return { offset, duration, gain: settings.level };
}
```

Every new clip starts at `{ trimStart: 0, trimEnd: 1, level: 0.7 }`. Settings updates clamp to `0..1` and preserve at least a one-percent trim window.

- [ ] **Step 4: Run GREEN and commit**

Run: `pnpm test src/features/studio/recording/clip-playback.test.ts src/features/studio/recording/use-sound-clip.test.ts`

Commit: `git commit -m "Add canonical sample clip settings"`

### Task 2: Shared live and offline clip playback

**Files:**
- Modify: `src/features/studio/audio/tone-engine.ts`
- Modify: `src/features/studio/audio/tone-engine.test.ts`
- Modify: `src/features/studio/use-studio-audio.ts`
- Modify: `src/features/studio/studio.tsx`
- Modify: `src/features/studio/render/render-project.ts`
- Modify: `src/features/studio/render/render-project.test.ts`

- [ ] **Step 1: Write failing transport tests**

```ts
expect(projectDurationSeconds(createDemoProject())).toBeGreaterThan(0);
expect(clipPlaybackWindow(8, settings, 2.1)).toEqual({ offset: 2, duration: 2.1, gain: 0.7 });
```

Add an engine-facing test that `clipShouldTriggerAtStep(0)` is true and every other step is false.

- [ ] **Step 2: Run RED**

Run: `pnpm test src/features/studio/audio/tone-engine.test.ts src/features/studio/render/render-project.test.ts`

Expected: FAIL because synchronized clip triggering is absent.

- [ ] **Step 3: Implement Tone.Player and offline parity**

```ts
export function clipShouldTriggerAtStep(step: number): boolean {
  return step === 0;
}
```

`ToneStudioEngine.updateClip(clip)` loads or replaces one `Tone.Player`, routes it through a gain into the limiter, and reads the pure playback window at step zero. `stop()` stops the player. `renderProjectToWav()` uses the same window for `source.start(0, offset, duration)` and the same gain.

- [ ] **Step 4: Run GREEN and commit**

Run: `pnpm test src/features/studio/audio/tone-engine.test.ts src/features/studio/render/render-project.test.ts`

Commit: `git commit -m "Sync sample clips with the loop transport"`

### Task 3: Trim, level, and selected-range preview UI

**Files:**
- Modify: `src/features/studio/recording/sound-clip-panel.tsx`
- Modify: `src/features/studio/studio.module.css`
- Modify: `src/features/studio/studio.test.tsx`

- [ ] **Step 1: Write failing component test**

```ts
expect(screen.getByRole("slider", { name: "Clip start" })).toHaveValue("0");
fireEvent.change(screen.getByRole("slider", { name: "Clip level" }), { target: { value: "45" } });
expect(screen.getByRole("slider", { name: "Clip level" })).toHaveValue("45");
```

- [ ] **Step 2: Run RED**

Run: `pnpm test src/features/studio/studio.test.tsx`

Expected: FAIL because the three clip controls are absent.

- [ ] **Step 3: Implement controls and custom preview**

Render START, END, and LEVEL sliders only when a clip exists. The PREVIEW button seeks the hidden audio element to `duration * trimStart`, applies `level`, and pauses at `duration * trimEnd`. REMOVE remains explicit.

- [ ] **Step 4: Verify the complete slice**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Expected: all commands exit zero with no new warnings.

- [ ] **Step 5: Browser verification and commit**

Verify import, selected-range preview, loop playback, render invalidation, and mobile overflow in Chromium.

Commit: `git commit -m "Add clip trim and level controls"`

