# ADR 0003: Use Clanker v4 as the only MVP launch rail

**Status:** Accepted

## Context

TickerBeat needs to turn a finished audio artifact into a standard ERC-20 with
existing Base liquidity infrastructure. The product does not need a custom
token factory, bonding curve, transfer tax, or AMM.

## Decision

Use the official `clanker-sdk` v4 integration with Base, a WETH pair, official
pool presets, wallet-confirmed deployment, and TickerBeat interface context.
Keep publication and launch separate: audio, cover, and project state are
uploaded before the deployment transaction is constructed.

The launch adapter will use the connected user's wagmi/viem wallet client. It
will simulate the transaction, display the predicted address and value, append
the configured Base Builder Code suffix, require an explicit wallet signature,
and accept success only after the expected `TokenCreated` receipt event.

## Consequences

- TickerBeat inherits Clanker's standard ERC-20 and Uniswap v4 deployment path.
- No private key is held by the app or server.
- The application owns the audio-first discovery layer because Clanker's token
  metadata schema is intentionally narrower than TickerBeat's publication data.
- Zora, Flaunch, custom factories, and a second launch adapter are outside the
  MVP.

## Evidence checked on 2026-08-13

- `clanker-sdk` 4.2.18 source and v4 examples
- Clanker generated SDK documentation
- Base's official token-launch and standard-web-app guidance
- Base Builder Code `dataSuffix` guidance and Clanker deploy support
