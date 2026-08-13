# TickerBeat

**Make sound. Make market.**

TickerBeat is a browser DJ desk where a creator builds a short loop, records or
imports a sound, publishes a reproducible release bundle to IPFS, and launches
that release as a standard token market on Base through Clanker v4.

## What works

- Four-track, sixteen-step sequencer with tempo, swing, accent, mute, solo,
  instrument, filter, echo, and per-track volume controls.
- Live playback and offline WAV rendering through the same deterministic sound
  plan.
- Microphone recording or audio-file import with local IndexedDB persistence.
- Immutable publication bundle: WAV, cover, project snapshot, and metadata on
  IPFS through a server-only Pinata credential.
- Recoverable release flow: render -> publish -> simulate -> wallet approval ->
  confirmation.
- Clanker v4 deployment on Base with a WETH pool, standard positions, no
  automatic developer buy, and the creator wallet as token admin and reward
  recipient.
- Verified release board backed by Clanker data and Base receipt/event checks.
- Optional Base Builder Code attribution using the `bc_...` value from
  `base.dev`.

TickerBeat never stores a private key and never submits a launch without the
connected wallet's explicit confirmation.

## Local development

Requirements: Node.js 22+ and pnpm 11.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Configure these values in `.env.local` for the publication flow:

```dotenv
PINATA_JWT=
NEXT_PUBLIC_GATEWAY_URL=https://your-gateway.mypinata.cloud
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_BUILDER_CODE=bc_yourcode
BASE_RPC_URL=
```

`PINATA_JWT` is server-only. Never prefix it with `NEXT_PUBLIC_` and never put
credentials in Git, screenshots, issues, or deployment logs.

## Verification

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm audit --prod --audit-level high
```

## Owner runbooks

- [Production launch](docs/runbooks/production-launch.md)
- [Domain and DNS](docs/runbooks/domain-and-dns.md)
- [Clanker launch](docs/runbooks/clanker-launch.md)
- [Base.dev and Talent](docs/runbooks/talent-project.md)

Architecture decisions and source-backed design research live under
[`docs/`](docs/). Open-source products were studied for interaction patterns;
no incompatible code or assets were copied.

## Contribution policy

Every contribution must change the product, tests, documentation, security, or
operations in a reviewable way. TickerBeat does not generate empty commits or
artificial activity for contribution counters.

## License

MIT
