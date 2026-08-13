# Production launch runbook

## Release boundary

The application is deployable before a token exists. Mainnet token creation is
always a separate user-approved action inside the Finish stage.

The application must never receive a private key. The browser obtains a wallet
client from the connected wallet, simulates the Clanker transaction, displays
the predicted token address and required value, and submits only after the user
presses the final launch button and approves the wallet prompt.

## One-time Vercel configuration

Open the `tickerbeat` project in Vercel, then add the following under **Project
Settings -> Environment Variables** for Production and Preview as appropriate:

| Variable | Required | Visibility | Value |
| --- | --- | --- | --- |
| `PINATA_JWT` | Yes | Server secret | Restricted Pinata JWT with upload permission |
| `NEXT_PUBLIC_GATEWAY_URL` | Yes | Public | Dedicated HTTPS Pinata gateway origin |
| `NEXT_PUBLIC_APP_URL` | Yes in production | Public | Canonical `https://` site URL |
| `NEXT_PUBLIC_BASE_BUILDER_CODE` | Recommended | Public | Raw `bc_...` code copied from Base.dev |
| `BASE_RPC_URL` | Optional | Server secret | Trusted Base mainnet RPC endpoint |

Redeploy after changing a `NEXT_PUBLIC_` variable because Next.js embeds public
values during the build.

Do not place credentials in the repository, GitHub Actions output, Vercel build
logs, Talent, Base.dev, or token metadata. Rotate a credential immediately if
it appears in any of those places.

## Release gate

Run from a clean checkout of the intended release commit:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm audit --prod --audit-level high
```

Then verify on the deployed URL:

1. Make, Mix, Finish, and Board are usable at mobile and desktop widths.
2. A loop plays and the same project renders to a WAV.
3. A recorded/imported clip survives a reload.
4. Publish creates working audio, cover, project, and metadata IPFS links.
5. A disconnected user is prompted to connect a wallet only in the release
   flow.
6. Review switches to Base, simulates the launch, and shows the predicted token
   address before submission.
7. Cancel the wallet prompt during dry verification. A real launch is performed
   only when the owner intentionally approves it.

## Abuse and failure model

The publication route enforces multipart input, an 18 MiB request ceiling,
strict artifact validation, generic upstream errors, security headers, and a
small per-instance rate limiter. Vercel serverless instances do not share that
in-memory limiter; if public abuse becomes material, replace it with a durable
edge/Redis rate limiter before increasing traffic.

The UI retains the last safe release state when publication, review, submission,
or confirmation fails. A transaction is considered launched only after a
successful Base receipt and matching Clanker factory event.

## Final owner actions

1. Buy/connect the domain and set the canonical URL.
2. Add the Pinata and optional RPC secrets plus the Base Builder Code in Vercel.
3. Review and approve the intentional Clanker deployment in the connected Base
   wallet.

Sources: [Vercel custom domains](https://vercel.com/docs/domains/set-up-custom-domain),
[Pinata quickstart](https://docs.pinata.cloud/quickstart), and
[Base standard web app checklist](https://docs.base.org/apps/guides/migrate-to-standard-web-app).
