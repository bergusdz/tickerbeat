# Base.dev and Talent runbook

## Base.dev

Register TickerBeat as a standard web app after the canonical production domain
works. Complete:

- name: `TickerBeat`
- tagline: `Make sound. Make market.`
- description: browser DJ desk for playable token releases on Base
- icon and screenshots from the production build
- category: consumer app / music creator tooling
- primary URL: canonical production domain
- Builder Code: copy the generated `bc_...` value into Vercel as
  `NEXT_PUBLIC_BASE_BUILDER_CODE`

The Base App now discovers registered standard web apps through Base.dev
metadata and Builder Codes. TickerBeat does not need a legacy Farcaster mini-app
manifest.

## Talent project

The existing Talent project is owned by `umbretttas.base.eth`, named
`TickerBeat`, and categorized as `Consumer Apps`.

Complete it in this order:

1. Connect the same public GitHub account that owns or visibly contributes to
   the repository.
2. Under **Project -> Edit -> Data Sources**, add the public TickerBeat
   repository.
3. Add the canonical website only after the domain is live and verified.
4. After the first intentional mainnet launch, add the Base token/contract
   address and confirm the explorer link resolves.
5. Keep only actual contributors in Team. Do not add identities solely to alter
   contribution statistics.
6. Confirm the project page exposes GitHub activity and onchain impact after
   Talent's next indexing cycle.

Talent combines connected Accounts and verified Data Points. A visible project
card and a rewards ranking are different things; neither GitHub commit volume
nor a contract address alone guarantees campaign placement.

## Base Builder Grant form

Submit only after the form's required evidence exists:

- live production URL
- short Loom demo
- Base mainnet contract address
- honest usage numbers (users, DAU, WAU, volume)
- concrete three-month GTM plan
- Base Builder Code

Before those exist, the application would contain placeholders and is weaker
than waiting for a shipped, usable release. Base describes Builder Grants as
retroactive support for shipped projects demonstrating real value.

Sources: [Talent concepts](https://docs.talent.app/docs),
[Base standard web app registration](https://docs.base.org/apps/guides/migrate-to-standard-web-app),
[Base Builder Codes](https://docs.base.org/apps/builder-codes/builder-codes), and
[Base funding paths](https://docs.base.org/get-started/get-funded).
