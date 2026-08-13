# TickerBeat Finished Sound Implementation Plan

**Goal:** Turn the playable sequencer into a durable, exportable sound artifact before adding wallet or launch-protocol code.

## 1. Versioned local draft

- Add strict project parsing and versioned serialization.
- Restore a valid local draft during client initialization.
- Persist every committed project state without storing credentials or wallet data.
- Verify malformed and obsolete data falls back safely to the demo project.

## 2. Optional recorded/imported clip

- Add a small browser recorder around `MediaRecorder`.
- Accept a short local audio file through the same clip boundary.
- Keep microphone permission user-initiated and expose clear recording/error states.
- Add preview, replace, and remove controls.

## 3. Canonical one-bar render

- Render the deterministic sequencer pattern into an audio buffer.
- Mix the optional clip without mutating the project state.
- Encode a standards-compliant WAV blob in the browser.
- Generate a deterministic SVG cover from title, tempo, and pattern density.

## 4. Finish-track flow

- Replace the placeholder notice with title/ticker review and render progress.
- Provide local audio playback and downloads for WAV, SVG, and project JSON.
- Keep publishing and Base launch visibly unavailable until the next slice.

## Verification

- Unit tests for persistence validation, timing, WAV headers, and cover stability.
- Component tests for restoring a draft and producing a finished artifact.
- Typecheck, lint, production build, and Chromium interaction checks.
