# TickerBeat MVP Design

**Status:** Approved for implementation
**Date:** 2026-08-13
**Network:** Base mainnet after testnet-compatible integration checks
**Product:** Browser DJ desk where every published groove can become a tradable ERC-20

## 1. Product definition

TickerBeat is a browser groovebox, not a voice recorder and not a generic token
launcher. A user builds a short musical loop with drums, bass, chords, lead,
samples, effects, tempo, swing, and optional microphone audio. The finished
sound is published as a playable artifact. After one explicit wallet
confirmation, that artifact is launched as its own ERC-20 market on Base.

The public board is the second half of the product: every card can be played
before it is traded. The sound, not the ticker alone, is the unit of discovery.

## 2. MVP user flow

1. Open the desk and start from an empty pattern or a small preset.
2. Program drums, bass, chords, and lead on a 16-step sequencer.
3. Add a sample or record a short microphone clip if desired.
4. Adjust tempo, swing, track volume, mute/solo, and a deliberately small set
   of effects.
5. Play the loop continuously while editing it.
6. Press **Finish track** to render the canonical audio and generate cover art
   from the project state.
7. Enter a title and ticker, then press **Launch sound**.
8. Upload audio, artwork, and metadata to IPFS.
9. Review the launch transaction and confirm it in the connected wallet.
10. Return to a public token page containing the player, creator, contract,
    market data, and buy/sell actions.
11. The new sound also appears on the public board.

Publishing and launching are separate internal states, but the interface may
present them as one guided action. No wallet transaction is ever signed
automatically.

## 3. Launch protocol decision

### Selected for MVP: Zora Content Coins

Zora Content Coins is the closest existing production architecture to the
TickerBeat model:

- one content object becomes one ERC-20;
- it is deployed on Base through a shared factory;
- the factory creates its Uniswap v4 market;
- metadata follows EIP-7572 and supports `animation_url` for audio;
- the creator, payout recipient, platform referrer, metadata URI, and ticker
  are explicit launch inputs;
- factory events expose enough data to build a project board and recover the
  read model;
- the official SDK can return transaction calldata for the user's wallet;
- existing open-source music projects already use this path.

TickerBeat will use an ETH-backed Content Coin for the first release. A Zora
Creator Coin is not required. TickerBeat's address is supplied as the platform
referrer and the musician remains the creator/payout recipient.

### Reserved alternative: Clanker v4

Clanker v4 is a valid generic Base token launcher with a fixed token supply,
Uniswap v4 liquidity, metadata, configurable paired assets, market-cap
settings, and creator/interface reward splits. It remains the fallback if a
verified compatibility spike shows that Zora's create or trade flow cannot
support the target Base wallet experience.

Clanker is not used simultaneously with Zora in the MVP. Supporting two launch
rails would duplicate metadata, indexing, quoting, and failure handling without
improving the first user experience.

### Explicitly excluded: custom token factory and AMM

TickerBeat will not deploy a custom ERC-20 factory, liquidity vault, bonding
curve, transfer-tax token, or AMM in the MVP. Those components do not improve
music creation and would add contract risk, audits, liquidity design, and an
unnecessary maintenance surface.

## 4. System shape

```text
Browser DJ desk
  -> canonical project state
  -> offline audio render
  -> IPFS audio + cover + EIP-7572 metadata
  -> Zora createCoinCall transaction
  -> Zora Content Coin + Uniswap v4 market on Base
  -> event/indexing layer
  -> public playable token board
```

The system has four deliberately separate boundaries:

1. **Music engine:** deterministic project state, sequencer, playback, samples,
   recording, effects, and offline rendering.
2. **Publication:** asset validation, hashing, upload, and immutable metadata.
3. **Launch adapter:** Zora transaction construction and receipt parsing.
4. **Discovery/trading:** board, token page, market reads, and wallet-confirmed
   swaps.

The music engine must not import wallet, chain, IPFS, or Zora code. The launch
adapter receives a completed publication receipt and cannot edit the sound.

## 5. Repository layout

Start with one Next.js application. A monorepo would add coordination and build
surface before the product has a second deployable unit. Keep the music domain
independent through folder and import boundaries; extract packages only after a
real second consumer exists. Do not add a custom contract workspace unless a
later product requirement genuinely needs contracts owned by TickerBeat.

```text
src/
  app/                   Next.js routes, layouts, and API handlers
  features/
    studio/              Project state, sequencer UI, audio, rendering
    publication/         Canonical metadata and storage adapter
    launch/              Typed Zora launch and receipt adapter
    discovery/           Board, token pages, and event normalization
  shared/                Small cross-feature UI and infrastructure helpers
docs/
  decisions/            Protocol and product ADRs
  research/             Source-backed protocol notes
  superpowers/specs/    Approved product and engineering designs
```

## 6. Musical scope

The first usable desk contains:

- four primary tracks: drums, bass, chords, and lead;
- 16 visible steps and up to four pattern pages;
- play/stop, tempo, swing, clear, duplicate, undo, and redo;
- velocity/accent per step;
- instrument selection from a small bundled library;
- per-track volume, mute, and solo;
- one filter and one send effect per track;
- a sample pad/import path;
- one optional microphone clip with trim and level controls;
- deterministic offline rendering to an audio file.

The interface should feel like a compact performance instrument: transport and
master controls remain visible, the active track is obvious, and sound begins
only after an intentional user gesture. AI composition, collaborative editing,
full DAW automation, arbitrary plugins, and sample marketplaces are outside the
MVP.

## 7. Canonical publication

Each finished version produces three content-addressed assets:

1. rendered audio;
2. cover image;
3. metadata JSON.

Metadata includes the title, description, creator address, audio URI and MIME
type, image URI, project-state hash, renderer version, duration, tempo, musical
key, and TickerBeat application URL. `animation_url` points to the IPFS audio
artifact so compatible clients can play it.

The project-state file may also be published for provenance and future remix
features, but it is not required by the token contract. A launch record stores
the project hash, metadata URI, predicted token address, transaction hash,
creator, and timestamp. Repeating a failed operation reuses the same uploaded
assets rather than producing duplicate files.

## 8. Launch transaction

The launch adapter builds the official Zora `createCoinCall` transaction with:

- connected wallet as `creator`;
- user-selected title and validated symbol;
- final IPFS metadata URI;
- ETH-backed currency mode;
- TickerBeat platform-referrer address;
- creator-controlled payout recipient;
- Base chain ID;
- a fixed, product-selected starting-market-cap option.

The app shows the network, creator, predicted address, metadata URI, transaction
value, and protocol before confirmation. The connected wallet signs and sends
the transaction. TickerBeat stores no user private key and performs no server-
side deployment on the user's behalf.

The receipt is considered launched only after the expected factory event is
found and its creator, URI, and predicted address match the pending launch.

## 9. Board and token page

The board is audio-first. A card contains:

- cover and title;
- play/pause with a short waveform or progress display;
- creator and launch time;
- ticker and contract link;
- price/market-cap/volume fields when the data is available;
- a clear route to the token page.

Only one preview plays at a time. Scrolling the board must not download every
full audio file immediately; metadata and covers load first, and audio loads on
intent.

The token page adds full playback, metadata/provenance, Base explorer links,
market data, and buy/sell controls. Every trade uses a quoted amount, explicit
slippage, and wallet confirmation. If the official Zora trade helper does not
support the target wallet type, the MVP links to the verified external market
rather than silently adding a custom router.

## 10. Indexing

The authoritative launch source is the Zora factory event, not a mutable form
submission. The read model normalizes creation events and enriches them with
IPFS metadata and market reads.

Required guarantees:

- idempotency by chain ID, transaction hash, and log index;
- confirmation depth before public listing;
- reorg-safe rescan window;
- strict allow-list for the selected factory and Base network;
- visible degraded state when market data is unavailable;
- links from displayed contract claims to Base explorer evidence.

For the smallest first deployment, creation receipts may populate the database
immediately while a scheduled reconciler rechecks factory events. A full custom
indexer is added only when the public board needs discovery beyond launches
made through the TickerBeat interface.

## 11. Base App and attribution

Before mainnet launch, run a small compatibility spike covering:

- connected EOA wallet;
- Base Account or other smart-wallet transaction path;
- Zora create calldata through wagmi;
- Zora trade helper or the verified external trade fallback;
- Base Builder Code attribution where the transaction client supports a data
  suffix without changing protocol calldata semantics.

Builder Code is attribution, not the source of truth for TickerBeat metrics.
Talent should track the public GitHub repository and the deployed project
contract/data source that the platform accepts. No artificial commits or
transactions are part of the product plan.

## 12. Security boundaries

- No private keys, seed phrases, API keys, or upload credentials in the client
  bundle or repository.
- Upload credentials are server-side, scoped, and rate-limited.
- Audio type, size, and duration are validated before storage.
- Metadata is schema-validated before transaction construction.
- Token names and symbols are escaped and length-limited.
- Chain ID, factory address, and referrer address are application constants
  sourced from verified deployment documentation.
- The UI never promises price growth, guaranteed liquidity, or profit.
- Every publish, launch, approval, and trade state has a recoverable failure
  path.

## 13. Delivery slices

### Slice 1: playable instrument

Bootstrap the workspace and deliver a deterministic four-track sequencer with
playback, presets, undo/redo, and tests. No wallet or token code.

### Slice 2: finished sound

Add sample import, microphone clip, effects, offline render, cover generation,
and local draft persistence.

### Slice 3: publication

Add canonical metadata, IPFS upload, publication receipt, retry behavior, and a
preview of the future token card.

### Slice 4: Base launch

Integrate Zora create calldata, wallet confirmation, receipt verification, and
Base explorer links. Test the complete path with the least risky supported
environment before mainnet.

### Slice 5: board and trading

Add creation-event reconciliation, public audio cards, token pages, market
reads, and the verified trade path.

### Slice 6: public readiness

Complete responsive design, accessibility, performance, secret scanning,
error monitoring, analytics, deployment documentation, Talent data sources,
and grant-ready demo materials.

## 14. Acceptance criteria

The MVP is ready for public launch when:

- a new user can create and hear a coherent loop without connecting a wallet;
- samples and optional microphone audio survive preview and offline render;
- the rendered audio and metadata are content-addressed and independently
  retrievable;
- a connected user can explicitly launch that sound through the selected Zora
  factory on Base;
- the resulting address and metadata match the confirmed factory event;
- the public board can play the sound and open its verified token page;
- the trade route either succeeds with quoted slippage or sends the user to a
  verified protocol market;
- repository checks cover music-state invariants, rendering, metadata,
  transaction construction, and receipt parsing;
- production secrets are absent from Git history and client bundles;
- the live site, GitHub repository, explorer evidence, and Talent project point
  to the same product identity.

## 15. Primary implementation references

- Zora protocol and contract documentation: <https://github.com/ourzora/zora-protocol>
- Zora Coins SDK documentation: <https://docs.zora.co/coins/sdk/create-coin>
- Zora coin metadata: <https://docs.zora.co/coins/contracts/metadata>
- Zora contract architecture: <https://docs.zora.co/coins/contracts/architecture>
- Clanker SDK, reserved alternative: <https://github.com/clanker-devco/clanker-sdk>
- Songcoin, music-to-Zora reference: <https://github.com/0xgonzalo/songcoin>
- This Song Meant, music metadata reference: <https://github.com/Nishu0/thissongmeant>
