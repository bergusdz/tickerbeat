# Clanker v4 launch runbook

## Fixed MVP configuration

TickerBeat uses the official `clanker-sdk` v4 path rather than a custom token
factory:

- Base mainnet (`chainId` 8453)
- WETH paired asset
- Clanker's standard liquidity positions
- static 1% fee configuration and 15-second sniper-tax decay
- no automatic developer buy
- connected creator wallet as token admin
- connected creator wallet receives 100% of the configured creator reward
- IPFS cover, audio URL, metadata URL, and TickerBeat context embedded in the
  deployment configuration

This keeps the token and market compatible with Clanker's public indexing and
avoids introducing a custom financial contract that would require a separate
audit.

## User launch sequence

1. Finish the loop and render the release.
2. Connect the intended creator wallet.
3. Publish the bundle to IPFS. The publication records that wallet as creator.
4. Press **Check launch**. TickerBeat builds the Clanker v4 configuration,
   requests the predicted address, and simulates it on Base.
5. Check the creator address, token name/symbol, predicted address, metadata,
   and ETH value displayed in the review.
6. Press the final launch button and approve the wallet transaction.
7. Wait for a successful Base receipt. TickerBeat accepts the result only when
   the receipt contains a matching Clanker factory launch event.
8. Verify the token on Basescan and Clanker. The Board entry is based on public
   Clanker data reconciled with Base, not on an unverified local form value.

If the wallet used for launch differs from the immutable publication creator,
TickerBeat refuses the launch. If launch inputs change after simulation, a new
review is required.

## Builder attribution

Register TickerBeat on Base.dev and copy its `bc_...` Builder Code into
`NEXT_PUBLIC_BASE_BUILDER_CODE`. The app converts it to an ERC-8021 data suffix
and passes it to the official Clanker deploy call. Existing contracts do not
need modification; Base indexes the appended suffix offchain.

After deployment, verify attribution in Base.dev and, if needed, use Base's
Builder Code validation tool against the transaction hash.

Sources: [Clanker SDK repository and generated docs](https://github.com/clanker-devco/clanker-sdk),
[Clanker deployment UI](https://clanker.world/deploy), and
[Base Builder Codes for app developers](https://docs.base.org/apps/builder-codes/app-developers).
