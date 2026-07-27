# Tickerbeat Core Design

**Status:** Approved product direction; written design awaiting final review  
**Date:** 2026-07-27  
**Network:** Base  
**Product:** AI music creation followed by an explicit ERC-20 market launch

## 1. Purpose

Tickerbeat turns a short musical idea into a reproducible project and, only
after an explicit user action, into a standard ERC-20 market on Base. The first
engineering milestone builds the deterministic project core. It does not ship a
production token launcher, polished interface, or autonomous GitHub activity.

The product must preserve a clean separation between:

1. musical project state;
2. browser audio playback and rendering;
3. AI-generated editing instructions;
4. publication and indexing;
5. Base contracts and Uniswap V3 execution.

This boundary lets the same project JSON produce the same musical structure
without depending on a model provider, wallet, database, or UI framework.

## 2. User flow

1. A user opens a new four-track, four-bar project.
2. The user edits steps or describes a desired change in natural language.
3. The server converts the prompt into a structured `PatchDelta`.
4. The client validates the delta and queues it for the next bar boundary.
5. All operations in the delta apply atomically and can be undone as one action.
6. The user previews and renders a 16–30 second loop.
7. The user explicitly publishes immutable project, audio, and metadata assets.
8. The user separately confirms a Base transaction that creates the token and
   its Uniswap V3 market.
9. Other users can listen and buy. Remixing and forking are outside the first
   product scope.

No AI response can publish, deploy, trade, or sign a wallet transaction.

## 3. Repository boundaries

The implementation will use a small TypeScript monorepo plus an isolated
Foundry contract workspace:

```text
apps/
  web/                 Next.js web shell, API routes, wallet and publication UI
packages/
  core/                Project state, validation, patching, timing and undo
  audio/               Tone.js transport, instruments, preview and rendering
  publication/         Canonical serialization, hashes and IPFS adapters
  contracts-client/    Generated ABIs and typed Base transaction builders
contracts/             Foundry contracts, scripts, unit and invariant tests
indexer/               Contract-event ingestion and read models
docs/                  Design, decisions, operating and security documentation
```

`packages/core` has no dependency on React, Tone.js, an AI SDK, wagmi, IPFS, or
contract libraries. Integration packages may depend on the core, never the
reverse.

## 4. Canonical project model

The canonical project is versioned JSON:

```ts
type TrackRole = "drums" | "bass" | "chords" | "lead";

interface ProjectState {
  schemaVersion: 1;
  id: string;
  revision: number;
  title: string;
  tempo: number;
  swing: number;
  key: string;
  scale: string;
  bars: 4;
  stepsPerBar: 16;
  tracks: [TrackState, TrackState, TrackState, TrackState];
}

interface TrackState {
  role: TrackRole;
  muted: boolean;
  gain: number;
  instrument: InstrumentState;
  effects: EffectsState;
  steps: StepState[];
}

interface StepState {
  active: boolean;
  note?: string;
  velocity: number;
  gate: number;
}
```

Validation enforces exactly one track per role, exactly 64 steps per track,
bounded tempo/swing/gain/velocity/gate values, supported instruments and
effects, and valid notes for pitched tracks. Unknown fields are rejected in AI
responses and ignored only during an explicit future schema migration.

Canonical serialization sorts object keys and normalizes numbers before
hashing. The content hash, not a mutable database row, identifies a published
version.

## 5. PatchDelta and AI boundary

AI edits use a narrow command language rather than free-form project JSON:

```ts
interface PatchDelta {
  schemaVersion: 1;
  projectId: string;
  expectedRevision: number;
  summary: string;
  operations: PatchOperation[];
}

type PatchOperation =
  | SetStepOperation
  | ClearTrackOperation
  | SetTempoOperation
  | SetSwingOperation
  | SetInstrumentParamOperation
  | SetEffectParamOperation;
```

Each operation uses an allow-listed path and bounded value. A delta is rejected
if it targets another project, uses a stale revision, contains an unsupported
operation, exceeds an operation-count limit, or would create an invalid final
state.

Applying a delta is a pure transaction:

1. validate the request;
2. apply all operations to a copy;
3. validate the complete result;
4. increment the revision once;
5. return the new state plus one undo record.

The web client queues a valid result and swaps state at the next bar boundary.
An invalid or stale result changes nothing. Undo restores the exact pre-delta
state. Model output is never executed as code.

The first milestone tests this boundary with deterministic fixtures. A live AI
provider is added only after the schema and reducer pass property-based tests.

## 6. Timing and audio

The core represents musical position as integer ticks, bars, and steps. It does
not read wall-clock time. `packages/audio` maps this schedule to Tone.js and is
responsible for:

- unlocking audio after a user gesture;
- scheduling all four tracks ahead of playback;
- applying queued state at a bar boundary;
- rebuilding only affected instruments or effects;
- preventing duplicate events after pause/resume;
- rendering the project loop offline to an audio blob.

The initial render repeats the four-bar project to the closest duration inside
16–30 seconds. Published metadata records tempo, duration, project hash, audio
hash, renderer version, and sample-pack version so a listener can distinguish
the canonical artifact from a later renderer.

## 7. Publication model

Publication is a two-phase operation:

1. generate and hash canonical project JSON, rendered audio, artwork, and
   metadata;
2. upload those immutable artifacts through a server-issued, scoped IPFS upload.

The server stores no wallet private key. It returns content identifiers and a
publication receipt. A failed upload can be retried idempotently using the
project hash. Database rows are read-model caches and can be rebuilt from IPFS
metadata and contract events.

Publishing does not create a token. Launching requires a separate wallet
confirmation and passes the final metadata URI and content hash to the factory.

## 8. Base and Uniswap V3 launch boundary

The financial layer consists of three contracts:

### LoopToken

- Standard fixed-supply ERC-20.
- No owner mint, proxy upgrade, transfer tax, blacklist, pause, or hidden fee.
- Supply, name, symbol, creator, and publication hash are fixed at creation.

### LoopLaunchFactory

- Creates a token through a deterministic implementation.
- Validates launch parameters and unique publication hashes.
- Creates or initializes a Base Uniswap V3 token/WETH pool.
- Mints one-sided token liquidity at an explicitly calculated initial price and
  tick range.
- Transfers the resulting position NFT directly to `LoopFeeVault`.
- Emits one canonical launch event containing creator, token, pool, position,
  publication hash, fee tier, ticks, supply, and referral.

The exact price/tick formula and allowed fee tier are contract-plan decisions,
not UI input in the first release. Arbitrary user-selected ranges are excluded.

### LoopFeeVault

- Permanently owns each position NFT.
- Cannot transfer the NFT or decrease/remove principal liquidity.
- Can collect accrued Uniswap fees.
- Splits collected fees according to immutable launch attribution.
- Uses pull-based claims to avoid loops and failed recipient transfers.

Provisional economics are 50% creator and 50% platform. With a valid referral,
the platform half becomes 25% platform and 25% referrer. Self-referral and the
zero address are rejected. These percentages remain configurable in the design
until contract implementation begins; they must be immutable or timelocked in
production.

The first contract release targets Base Sepolia. Base mainnet deployment is
blocked until unit, fuzz, invariant, fork tests, source verification, and an
independent security review are complete.

## 9. Trading boundary

Tickerbeat never implements a custom AMM. Buying routes WETH/ETH through
Uniswap's supported router into the created V3 pool. The app builds a quote,
shows minimum output, price impact, fee tier, deadline, and referral attribution
before wallet confirmation.

Slippage protection is mandatory. Transactions use exact-input semantics and
must revert below the displayed minimum output. The web app cannot claim a
stable or always-rising price; price is determined by pool liquidity and
trading.

## 10. Indexing and discoverability

An event indexer consumes factory, pool, and fee-vault events and maintains
read models for:

- published projects;
- launch status and contract addresses;
- creator/referrer attribution;
- volume, swaps, liquidity and collected fees;
- unique interacting wallets;
- project activity timelines.

The indexer is idempotent by `(chainId, transactionHash, logIndex)`, stores the
last finalized block, and handles short reorgs. The frontend reads indexed data
but links every material metric to its source transaction or contract.

## 11. Security and failure behavior

- Browser and server validation share the same versioned schemas.
- AI and IPFS endpoints enforce authentication, size limits and rate limits.
- Upload credentials are short-lived and scoped.
- No deployment keys exist in the web runtime.
- Launch transactions are constructed client-side and signed by the user.
- Contract source, compiler settings and constructor arguments are verified.
- A launch cannot reuse an already registered publication hash.
- Partial publication never appears as launched.
- Indexing failures affect display only; they cannot change ownership or funds.
- Admin controls, if any survive implementation, use a multisig and timelock.

## 12. Testing strategy

### Core

- Schema accepts a canonical fixture and rejects malformed dimensions/ranges.
- Patch application is atomic.
- Stale revisions and unknown operations are rejected.
- Apply then undo restores byte-identical canonical JSON.
- Random valid deltas always produce a valid state.
- Timing produces the correct 256 step positions per four-track project.

### Audio

- A fake scheduler receives deterministic events.
- Pause/resume does not duplicate scheduled notes.
- A queued delta becomes active only at the next bar.
- Offline rendering returns the expected duration and non-empty audio.

### Publication

- Canonical serialization is stable across key order.
- Retries reuse the same content hash.
- Upload failures cannot produce a launchable receipt.

### Contracts

- Fixed supply cannot change after creation.
- Only canonical factory launches are registered.
- Position NFTs cannot leave the vault or lose principal liquidity.
- Fee accounting conserves collected token amounts.
- Self-referral cannot receive a share.
- Launch tick/price math holds across fuzzed parameters.
- Fork tests use official Base V3 deployments.

### End-to-end

- Create → edit → AI delta → undo → render → publish on test infrastructure.
- Publish → launch on Base Sepolia → buy with slippage protection → index events.
- A failed transaction or indexer outage leaves the project recoverable.

## 13. Delivery sequence

1. Bootstrap the monorepo, shared quality gates and deterministic core fixtures.
2. Implement schemas, canonical serialization, patch reducer and undo.
3. Implement timing and a fake audio adapter.
4. Integrate Tone.js playback and offline rendering.
5. Add the structured AI endpoint and provider adapter.
6. Add IPFS publication and publication receipts.
7. Implement and test Base Sepolia contracts.
8. Add the contract client, wallet flow and event indexer.
9. Build and refine the mobile-first interface.
10. Perform security review, production deployment and Talent project linking.

GitHub automation is deliberately outside this delivery sequence. After the
project is live, a Hermes maintenance job may open one evidence-backed PR when
real checks find a material change. It will not create empty commits, split
changes to inflate counts, impersonate a human author, or target a contribution
number.

## 14. Acceptance criteria for the first milestone

The first implementation milestone is complete when:

- the repository installs and runs its checks from a clean clone;
- a canonical four-track project fixture validates;
- valid deltas apply atomically at a simulated bar boundary;
- invalid and stale deltas leave state unchanged;
- undo restores the canonical fixture exactly;
- timing tests prove four bars × sixteen steps × four tracks;
- CI runs formatting, type checking, unit tests and secret scanning;
- no wallet, model-provider, database or UI dependency is required by the core.

