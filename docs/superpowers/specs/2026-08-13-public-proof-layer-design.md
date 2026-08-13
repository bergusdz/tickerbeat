# TickerBeat Public Proof Layer and Security Hardening

**Status:** Approved for implementation

**Date:** 2026-08-13

**Scope:** Public board and track pages, response headers, dependency advisory

## 1. Goal

Make every public TickerBeat release independently understandable and
verifiable without introducing a custom database or indexer. A visitor should
be able to identify the creator, launch time, immutable sound provenance, Base
contract, and current availability of market information.

## 2. Source-of-truth boundaries

- Clanker's public Base index remains authoritative for the token address,
  launch timestamp, image, audio pointer, and TickerBeat launch context.
- The metadata URI embedded in the Clanker record points to the immutable
  TickerBeat IPFS document. That document is authoritative for creator, tempo,
  duration, musical key, renderer version, and artifact hashes.
- BaseScan remains the independent contract-verification link.
- Base App remains the MVP trading destination.
- Missing or malformed enrichment data never invents values and never removes
  an otherwise valid Clanker release from the board.

## 3. Enrichment flow

`getTickerBeatReleases` and `getTickerBeatRelease` first parse the existing
Clanker payload, then fetch each available metadata URI on the server. Only
`ipfs://` and HTTPS metadata locations are accepted. IPFS locations resolve
through the configured public gateway, falling back to `ipfs.io` for reads.

The response is schema-checked at runtime. Only valid fields are copied into a
release. Fetch failures, timeouts, non-JSON responses, and invalid fields
produce a release with `provenance: null`; they do not fail the page. Next.js
revalidation caches upstream reads for 60 seconds. The board enriches at most
the 20 releases already requested from Clanker and performs independent reads
concurrently.

## 4. Public presentation

Each board card keeps lazy audio and one-at-a-time playback. It additionally
shows:

- shortened creator address linked to BaseScan;
- deterministic UTC launch date/time when available;
- tempo and duration when verified metadata is available;
- a compact `PROVENANCE VERIFIED` or `PROVENANCE UNAVAILABLE` state;
- `MARKET DATA UNAVAILABLE / OPEN VERIFIED MARKET` until a trusted quote source
  is integrated.

The track page presents the same evidence at higher detail: creator, launch
time, tempo, duration, key, renderer version, audio SHA-256, project SHA-256,
metadata link, contract link, and Base App market link. Hashes are displayed in
full with wrapping so they can be copied and compared.

The interface does not display placeholder prices, market caps, or volume and
does not imply that market data or liquidity is guaranteed.

## 5. Data model

`BoardRelease` gains an optional immutable provenance object:

```ts
type ReleaseProvenance = {
  creator: `0x${string}`;
  tempo: number;
  durationSeconds: number;
  musicalKey: string;
  rendererVersion: string;
  audioMimeType: "audio/wav";
  audioSha256: string;
  projectSha256: string;
  projectUri: string;
};
```

The object is either complete and verified by the runtime parser or `null`.
Partial provenance is not labelled verified.

## 6. Security headers

Next.js adds conservative response headers that do not interfere with wallet
connections, Web Audio, microphone permission, IPFS media, or external market
links:

- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: DENY`;
- `Permissions-Policy` allowing microphone only to the same origin while
  denying camera and geolocation;
- the existing platform HSTS header remains unchanged.

A Content Security Policy is intentionally deferred until all wallet connector
and IPFS gateway endpoints are enumerated and tested. Shipping an unverified CSP
could break the product's core wallet or audio paths.

## 7. Dependency advisory

The current Coinbase CDP SDK pins Axios 1.16.0, which is affected by
GHSA-gcfj-64vw-6mp9. Because the vulnerable package is transitive, add the
smallest pnpm override to Axios 1.18.0 and regenerate the lockfile. Keep the
override only if dependency resolution, unit tests, lint, typecheck, production
build, wallet UI loading, and Clanker transaction-construction tests all pass.
If any regression occurs, revert the override and document the upstream risk
rather than weakening wallet behavior.

## 8. Error handling and privacy

- Server logs and public errors never include credentials or full upstream
  response bodies.
- Metadata reads use bounded timeouts and fail closed to `provenance: null`.
- Publication credentials remain server-only and absent from the client bundle.
- Creator addresses are public onchain identifiers, not secrets.
- No transaction, approval, signature, upload, or external account mutation is
  performed by this slice.

## 9. Verification

Implementation is accepted when:

1. Parser tests reject partial, malformed, or wrong-app metadata and accept a
   complete TickerBeat provenance document.
2. Enrichment tests prove that failed metadata reads preserve the base release.
3. Board tests prove creator/time/status rendering without eager audio loading
   or simultaneous playback regressions.
4. Track-page tests prove full provenance and explicit market-data degradation.
5. Header tests or build inspection prove all selected headers are emitted.
6. `pnpm audit --prod --audit-level high` reports no high-severity advisory, or
   the override is reverted with the upstream exception documented.
7. All tests, lint, typecheck, and production build pass.
8. Desktop and mobile browser QA confirm the evidence remains readable and the
   studio, wallet-connect, microphone, and sound-board surfaces still load.

## 10. Non-goals

- No custom database, event indexer, price oracle, swap router, analytics stack,
  or monitoring vendor.
- No invented market values or offchain creator identity.
- No change to Clanker v4 launch configuration, fees, liquidity positions, or
  wallet-confirmation requirements.
- No automatic transaction or mainnet launch.
