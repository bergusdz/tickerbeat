# TickerBeat Production Architecture

## Outcome

TickerBeat remains one Base-first Next.js application. A user can create a one-bar composition, add one recorded or imported clip, hear the same arrangement that will be rendered, publish immutable release artifacts, review a Clanker v4 launch, confirm it in a wallet, and discover the confirmed token on the public board.

The product must be ready before any paid domain or production transaction is required. Domain purchase, production secrets and wallet signatures remain explicit owner actions.

## Invariants

1. The canonical project snapshot describes every input used to create the master.
2. Realtime preview and offline rendering consume one deterministic sound plan.
3. Publication and launch transitions are explicit, serializable and recoverable.
4. A board entry is backed by a verified Base receipt, not only by mutable API text.
5. No transaction is sent without an explicit wallet confirmation.
6. TickerBeat launches only through the documented Clanker v4 Base path in this release.

## Canonical project

`ProjectSnapshotV3` contains title, tempo, swing, four tracks and an optional `ClipReference`. The reference records asset id, SHA-256, name, MIME type, size, source and playback settings. The binary Blob is stored in IndexedDB through `ClipAssetStore`; it is not placed in localStorage or project JSON.

Draft persistence stores the V3 snapshot in localStorage and migrates V1/V2 projects to `clip: null`. Restoring a project with a clip loads the matching Blob, verifies its hash, and reports a recoverable missing/corrupt asset state.

## Sound pipeline

`createSoundPlan(snapshot)` is pure. It produces deterministic step start times, track routing descriptions, scheduled note/drum events and the optional clip playback event. Realtime and offline adapters use the same plan and the same synth graph factory.

Realtime playback uses Tone.js after a user gesture. Master export uses the official `Tone.Offline` API so the same Tone instruments and routing are rendered into a `ToneAudioBuffer`, then encoded to WAV.

## Release workflow

`ReleaseSession` is a discriminated union with these states:

`editing → rendering → rendered → publishing → published → reviewing → readyToLaunch → submitted → confirmed | failed`

The reducer owns invalidation and retry rules. React components render state and dispatch commands; they do not nest the next integration component. `PublicationGateway` and `TokenLauncher` are small ports implemented by existing Pinata HTTP and Clanker v4 adapters.

Only metadata that is bound to the canonical project/audio hashes can advance to launch. Changing the project after render invalidates all downstream receipts.

## Confirmed launch registry

After Base receipt verification, the application produces a `LaunchRecord` containing token, creator, transaction hash, block number, metadata URI, audio URI and confirmation timestamp. The creator's recoverable `ReleaseSession` persists this record locally.

The public board uses the official Clanker API as its candidate index, then reconciles every candidate against the pinned Clanker v4 factory `TokenCreated` event on Base. Human-readable descriptions are presentation data, never proof. This avoids introducing another database or paid service while retaining an authoritative onchain boundary.

## Product surface

The interface becomes a staged, mobile-first instrument:

- **Make** — transport, 16-step grid and immediate sound creation.
- **Mix** — instrument, volume, filter, echo and clip controls.
- **Finish** — title/ticker, deterministic render, IPFS publication and reviewed launch.
- **Board** — playable confirmed releases with token links.

Wallet and market language appears only in Finish. The sequencer is the dominant first viewport. The visual direction is derived from licensed/open-source grooveboxes and hardware-inspired music tools, but TickerBeat keeps original layout, branding and implementation.

## Public readiness

The repository ships `.env.example`, environment validation, security headers, API size/type validation, publication throttling, deployment runbooks, domain/DNS steps, Pinata setup, Base RPC/wallet checks and a launch checklist. No private key, API token or wallet seed is stored in Git, Vercel client variables or documentation.
