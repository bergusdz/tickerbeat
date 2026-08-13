# TickerBeat Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TickerBeat production-ready so the owner only needs to connect a paid domain, configure production secrets and confirm the final Clanker v4 Base transaction.

**Architecture:** One Next.js application with a pure canonical studio core, Tone.js realtime/offline adapters, a serializable release state machine, verified launch records and a staged mobile-first UI. External services remain behind narrow ports; no custom token contract or generic DI framework is introduced.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Tone.js 15, wagmi/viem, Clanker SDK v4, Pinata, Vitest, Testing Library, IndexedDB.

---

### Task 1: Canonical ProjectSnapshot V3

**Files:**
- Modify: `src/features/studio/core/model.ts`
- Modify: `src/features/studio/core/project-storage.ts`
- Modify: `src/features/studio/core/project-storage.test.ts`
- Modify: `src/features/studio/core/model.test.ts`

- [ ] **Step 1: Write failing V3 model and migration tests**

```ts
expect(createDemoProject()).toMatchObject({ version: 3, clip: null });
expect(parseStoredProject(JSON.stringify({ version: 2, project: oldProject }))).toMatchObject({
  version: 3,
  clip: null,
});
```

- [ ] **Step 2: Run the focused tests and confirm they fail because V3 fields are missing**

Run: `pnpm test src/features/studio/core/model.test.ts src/features/studio/core/project-storage.test.ts`

- [ ] **Step 3: Define the canonical types**

```ts
export type ClipReference = {
  assetId: string;
  sha256: string;
  name: string;
  mimeType: string;
  size: number;
  source: "microphone" | "file";
  level: number;
  trimStart: number;
  trimEnd: number;
};

export type StudioProject = {
  version: 3;
  title: string;
  tempo: number;
  swing: number;
  tracks: Track[];
  clip: ClipReference | null;
};
```

- [ ] **Step 4: Implement strict V3 parsing and V1/V2 migrations**

`serializeProject` must emit `{ version: 3, project }`; all legacy versions must be validated before migration and must receive `version: 3, clip: null`.

- [ ] **Step 5: Run focused and full tests**

Run: `pnpm test src/features/studio/core/model.test.ts src/features/studio/core/project-storage.test.ts && pnpm test`

- [ ] **Step 6: Commit and link issue #2**

```bash
git add src/features/studio/core
git commit -m "Model reproducible V3 studio projects"
```

### Task 2: Persist and restore clip assets

**Files:**
- Create: `src/features/studio/recording/clip-asset-store.ts`
- Create: `src/features/studio/recording/clip-asset-store.test.ts`
- Create: `src/features/studio/recording/indexeddb-clip-store.ts`
- Create: `src/features/studio/recording/clip-reference.ts`
- Create: `src/features/studio/recording/clip-reference.test.ts`
- Modify: `src/features/studio/recording/types.ts`
- Modify: `src/features/studio/recording/use-sound-clip.ts`
- Modify: `src/features/studio/recording/use-sound-clip.test.ts`
- Modify: `src/features/studio/studio.tsx`

- [ ] **Step 1: Write failing hash/reference and store-contract tests**

```ts
const blob = new Blob(["beat"], { type: "audio/wav" });
const reference = await createClipReference(blob, "beat.wav", "file");
expect(reference).toMatchObject({ name: "beat.wav", mimeType: "audio/wav", size: 4, source: "file" });
expect(reference.sha256).toMatch(/^[a-f0-9]{64}$/);
```

- [ ] **Step 2: Verify RED**

Run: `pnpm test src/features/studio/recording/clip-reference.test.ts src/features/studio/recording/clip-asset-store.test.ts`

- [ ] **Step 3: Implement the narrow persistence port**

```ts
export interface ClipAssetStore {
  put(reference: ClipReference, blob: Blob): Promise<void>;
  get(reference: ClipReference): Promise<Blob | null>;
  delete(assetId: string): Promise<void>;
}
```

`get` must recompute SHA-256 and throw `ClipAssetIntegrityError` on mismatch.

- [ ] **Step 4: Implement the IndexedDB adapter and explicit controller type**

`SoundClipController` must be declared in `recording/types.ts`; the type must no longer import the React hook implementation.

- [ ] **Step 5: Make the studio update `project.clip` and restore the Blob on hydration**

Replacing a clip stores the Blob before dispatching the new reference. Removing a clip deletes the referenced asset and sets `clip: null`.

- [ ] **Step 6: Run recording, studio and full tests**

Run: `pnpm test src/features/studio/recording src/features/studio/studio.test.tsx && pnpm test`

- [ ] **Step 7: Commit and update issue #2**

```bash
git add src/features/studio
git commit -m "Persist studio clip assets with project snapshots"
```

### Task 3: Shared deterministic SoundPlan and Tone offline render

**Files:**
- Create: `src/features/studio/core/timing.ts`
- Create: `src/features/studio/core/timing.test.ts`
- Create: `src/features/studio/core/sound-plan.ts`
- Create: `src/features/studio/core/sound-plan.test.ts`
- Create: `src/features/studio/audio/tone-graph.ts`
- Create: `src/features/studio/audio/tone-graph.test.ts`
- Modify: `src/features/studio/audio/tone-engine.ts`
- Modify: `src/features/studio/audio/tone-engine.test.ts`
- Modify: `src/features/studio/render/render-project.ts`
- Modify: `src/features/studio/render/render-project.test.ts`
- Modify: `src/features/studio/render/finish-panel.tsx`

- [ ] **Step 1: Write failing timing and sound-plan tests**

```ts
const plan = createSoundPlan(createDemoProject());
expect(plan.durationSeconds).toBeCloseTo(60 / 118 * 4);
expect(plan.events.filter((event) => event.trackId === "drums")).toHaveLength(4);
expect(plan.events[0].startSeconds).toBe(0);
```

- [ ] **Step 2: Verify RED**

Run: `pnpm test src/features/studio/core/timing.test.ts src/features/studio/core/sound-plan.test.ts`

- [ ] **Step 3: Implement pure timing and `SoundPlan` creation**

The plan must contain resolved track settings, scheduled notes, durations, velocities and an optional resolved clip event. No Tone.js or WebAudio type may appear in `studio/core`.

- [ ] **Step 4: Extract one Tone graph factory**

```ts
export function createToneGraph(tone: ToneModule, plan: SoundPlan): ToneGraph;
export function scheduleTonePlan(graph: ToneGraph, plan: SoundPlan, offset?: number): void;
```

Both realtime and offline paths call these functions.

- [ ] **Step 5: Replace raw OfflineAudioContext synthesis with documented `Tone.Offline`**

```ts
const buffer = await tone.Offline(() => {
  const graph = createToneGraph(tone, plan);
  scheduleTonePlan(graph, plan);
}, plan.durationSeconds, 2, 44_100);
```

Encode the returned channel data with the existing WAV encoder. Dispose graph nodes after scheduling/rendering.

- [ ] **Step 6: Add parity and invalidation tests, then run the full suite**

Run: `pnpm test src/features/studio/core src/features/studio/audio src/features/studio/render && pnpm test`

- [ ] **Step 7: Commit and close issue #3 when all acceptance criteria are proven**

```bash
git add src/features/studio
git commit -m "Share one sound plan across preview and export"
```

### Task 4: ReleaseSession state machine and integration ports

**Files:**
- Create: `src/features/release/core/release-session.ts`
- Create: `src/features/release/core/release-session.test.ts`
- Create: `src/features/release/core/ports.ts`
- Create: `src/features/release/adapters/pinata-publication.ts`
- Create: `src/features/release/adapters/clanker-launcher.ts`
- Create: `src/features/release/release-shell.tsx`
- Create: `src/features/release/release-shell.test.tsx`
- Modify: `src/features/studio/render/finish-panel.tsx`
- Modify: `src/features/publication/publish-panel.tsx`
- Modify: `src/features/launch/launch-panel.tsx`

- [ ] **Step 1: Write failing transition tests**

```ts
expect(reduceReleaseSession(editing, { type: "render-started", snapshotHash: "abc" }).status).toBe("rendering");
expect(() => reduceReleaseSession(editing, { type: "launch-submitted", txHash })).toThrow();
expect(reduceReleaseSession(rendered, { type: "project-changed" })).toEqual({ status: "editing" });
```

- [ ] **Step 2: Verify RED**

Run: `pnpm test src/features/release/core/release-session.test.ts`

- [ ] **Step 3: Implement the discriminated union, reducer and serializable receipts**

Every transition validates its prerequisite. Failure states retain the last safe state and operation name so retry is deterministic.

- [ ] **Step 4: Implement `PublicationGateway` and `TokenLauncher` adapters**

```ts
export interface PublicationGateway {
  publish(artifact: PublishableArtifact, creator: Address): Promise<PublicationReceipt>;
}

export interface TokenLauncher {
  review(input: LaunchInput): Promise<LaunchReview>;
  submit(review: LaunchReview): Promise<SubmittedLaunch>;
  confirm(submitted: SubmittedLaunch): Promise<ConfirmedLaunch>;
}
```

- [ ] **Step 5: Move orchestration to `ReleaseShell`**

Finish, Publish and Launch panels become presentational stages. They must not import one another or instantiate Clanker directly.

- [ ] **Step 6: Run release, publication, launch and full tests**

Run: `pnpm test src/features/release src/features/publication src/features/launch && pnpm test`

- [ ] **Step 7: Commit and close issue #4 after verification**

```bash
git add src/features/release src/features/publication src/features/launch src/features/studio/render
git commit -m "Model the recoverable release workflow"
```

### Task 5: Verified launch records and board reconciliation

**Files:**
- Create: `src/features/discovery/launch-record.ts`
- Create: `src/features/discovery/launch-record.test.ts`
- Create: `src/features/discovery/reconcile-launch.ts`
- Create: `src/features/discovery/reconcile-launch.test.ts`
- Modify: `src/features/board/clanker-api.ts`
- Modify: `src/features/board/release-board.tsx`
- Modify: `src/features/board/parse.ts`
- Modify: `src/features/launch/launch-receipt.ts`

- [ ] **Step 1: Write failing record reconciliation tests**

```ts
const verified = reconcileLaunchRecord(candidate, factoryEvent);
expect(verified).toMatchObject({ token: candidate.address, creator: factoryEvent.msgSender });
expect(() => reconcileLaunchRecord(candidate, conflictingEvent)).toThrow("does not match");
```

- [ ] **Step 2: Verify RED**

Run: `pnpm test src/features/discovery`

- [ ] **Step 3: Implement immutable `LaunchRecord` validation**

Creator-side records are accepted only from the confirmed release transition after existing factory/address/creator receipt checks and are serialized inside `ReleaseSession`.

- [ ] **Step 4: Add server-side Base factory reconciliation**

For each candidate returned by the official Clanker API, query the pinned Base factory's `TokenCreated` event filtered by token address and accept it only when token address, creator/admin and TickerBeat context match. Cache the reconciled result with Next.js revalidation; do not add a database.

- [ ] **Step 5: Make the board merge verified records with Clanker enrichment**

Verified event identity wins. Description regex remains only for extracting legacy media after identity has been verified.

- [ ] **Step 6: Run discovery, board and full tests**

Run: `pnpm test src/features/discovery src/features/board && pnpm test`

- [ ] **Step 7: Commit and close issue #5 after verification**

```bash
git add src/features/discovery src/features/board src/features/launch
git commit -m "Index verified TickerBeat launches"
```

### Task 6: Source-grounded design research

**Files:**
- Create: `docs/research/open-source-music-ui-patterns.md`
- Create: `docs/decisions/0004-staged-dj-workflow.md`

- [ ] **Step 1: Inspect repositories and licenses**

Review at minimum: `mxfng/drumhaus`, `gridsound/daw`, `naomiaro/waveform-playlist`, `jeco123/beatcraftery`, `raphaelsalaja/audio`, and `bitfieldaudio/OTTO`. Record repository URL, revision date, license and observed interaction pattern.

- [ ] **Step 2: Separate reusable patterns from prohibited copying**

MIT sources may inform implementation with attribution where code is adapted. AGPL/custom/unlicensed sources are visual/interaction references only; no source code or distinctive assets are copied.

- [ ] **Step 3: Commit the research and ADR**

```bash
git add docs/research/open-source-music-ui-patterns.md docs/decisions/0004-staged-dj-workflow.md
git commit -m "Research proven browser music interfaces"
```

### Task 7: Staged mobile-first DJ interface

**Files:**
- Create: `src/features/workspace/workspace.tsx`
- Create: `src/features/workspace/workspace.test.tsx`
- Create: `src/features/workspace/workspace.module.css`
- Create: `src/features/studio/components/transport.tsx`
- Create: `src/features/studio/components/step-grid.tsx`
- Create: `src/features/studio/components/mixer.tsx`
- Create: `src/features/studio/components/clip-deck.tsx`
- Modify: `src/features/studio/studio.tsx`
- Replace: `src/features/studio/studio.module.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Read and apply the `frontend-design` skill before editing UI files**

- [ ] **Step 2: Write failing workflow and accessibility tests**

```tsx
expect(screen.getByRole("tab", { name: /make/i })).toHaveAttribute("aria-selected", "true");
await user.click(screen.getByRole("tab", { name: /finish/i }));
expect(screen.getByRole("region", { name: /finish and launch/i })).toBeVisible();
```

- [ ] **Step 3: Verify RED**

Run: `pnpm test src/features/workspace/workspace.test.tsx`

- [ ] **Step 4: Implement Make, Mix, Finish and Board stages**

The first viewport contains brand, transport and sequencer. Make is the default stage; wallet controls are absent there. Stage navigation is keyboard-accessible and state survives stage changes.

- [ ] **Step 5: Implement the original visual system**

Use an instrument-like dark shell, one high-energy signal color, large readable controls, clear active-step motion and generous mobile hit targets. Do not copy branded hardware graphics, screenshots or source CSS from references.

- [ ] **Step 6: Run component tests and browser checks at 390px, 768px and 1440px**

Run: `pnpm test src/features/workspace src/features/studio && pnpm lint && pnpm typecheck && pnpm build`

- [ ] **Step 7: Commit and close issue #6 after visual evidence is captured**

```bash
git add src/app src/features/workspace src/features/studio
git commit -m "Redesign TickerBeat as a staged DJ instrument"
```

### Task 8: Production safety and owner handoff

**Files:**
- Modify: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/env.test.ts`
- Modify: `next.config.ts`
- Modify: `src/app/api/publish/route.ts`
- Create: `docs/runbooks/production-launch.md`
- Create: `docs/runbooks/domain-and-dns.md`
- Create: `docs/runbooks/clanker-launch.md`
- Create: `docs/runbooks/talent-project.md`
- Modify: `README.md`

- [ ] **Step 1: Write failing environment and API-boundary tests**

Tests cover missing server secrets, public/server variable separation, allowed media types, upload limits and throttling responses.

- [ ] **Step 2: Verify RED**

Run: `pnpm test src/lib/env.test.ts src/app/api/publish`

- [ ] **Step 3: Add strict environment parsing and security headers**

Only `NEXT_PUBLIC_*` values may reach client modules. Add CSP/frame/referrer/permissions headers compatible with wallet and IPFS requirements.

- [ ] **Step 4: Harden publication boundaries**

Reject oversized files before pinning, validate MIME and hashes, enforce bounded request frequency, and return stable error codes without leaking provider details.

- [ ] **Step 5: Write exact owner runbooks**

Document Vercel environment values, Pinata gateway/JWT setup, Base RPC, custom-domain DNS records, Base wallet/network checks, simulation, expected Clanker configuration, Basescan verification, Base App link and Talent data sources.

- [ ] **Step 6: Run the full release gate**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm audit --prod --audit-level high`

- [ ] **Step 7: Push the branch, open a draft PR and verify hosted preview**

```bash
git push -u origin codex/tickerbeat-production
gh pr create --draft --base main --head codex/tickerbeat-production --title "Prepare TickerBeat for production launch" --body-file docs/runbooks/production-launch.md
```

- [ ] **Step 8: Complete only after the owner-only boundary is explicit**

The final handoff lists exactly three external actions: buy/connect domain, enter production secrets, and confirm the reviewed Base transaction in the owner wallet.
