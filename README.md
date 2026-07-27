# Tickerbeat

**Make a beat. Launch a ticker.**

Tickerbeat is a mobile-first AI groovebox where a four-track musical loop can
be published and launched as a standard ERC-20 market on Base.

## Status

Tickerbeat is at the architecture stage. The first implementation milestone is
the deterministic music-project core; contract deployment and production
trading are intentionally deferred until the core, testnet flows, and security
invariants are verified.

## Product boundaries

- Four tracks: drums, bass, chords, and lead.
- Four bars with sixteen steps per bar.
- Structured AI edits applied atomically at the next bar boundary.
- Explicit publishing and token-launch actions.
- Public, content-addressed project and audio artifacts.
- Base-only production target.
- Standard ERC-20 tokens and Uniswap V3 liquidity, not NFTs.

The approved system design is documented in
[`docs/superpowers/specs/2026-07-27-tickerbeat-core-design.md`](docs/superpowers/specs/2026-07-27-tickerbeat-core-design.md).

## Development principles

- Meaningful commits only; no activity generated for contribution counters.
- Domain logic remains independent from browser audio, AI providers, and chain
  adapters.
- Mainnet financial contracts require invariant tests and independent review.
- Secrets never enter the repository.

## License

MIT

