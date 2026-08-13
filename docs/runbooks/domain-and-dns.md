# Domain and DNS runbook

## Connect the domain

1. Buy the chosen domain from the registrar you control.
2. In Vercel open **tickerbeat -> Settings -> Domains**, enter the domain, and
   add it to the project.
3. Use the exact DNS records shown by Vercel for this project. Do not assume a
   generic record when Vercel reports a project-specific value.
4. Add both the apex domain and the preferred `www` host. Choose one canonical
   host and redirect the other to it in Vercel.
5. Wait until Vercel reports a valid configuration and has issued TLS.
6. Set `NEXT_PUBLIC_APP_URL=https://<canonical-host>` in Production and
   redeploy.

For a typical external DNS provider, Vercel may request an apex `A` record or a
subdomain `CNAME`. The current values must always be copied from Vercel's domain
inspection screen because they can differ by project and configuration.

## Verify

```bash
curl -I https://<canonical-host>
```

Confirm:

- HTTPS succeeds without a certificate warning.
- The non-canonical host redirects once to the canonical host.
- `/robots.txt`, `/sitemap.xml`, `/track/<address>`, and the homepage resolve.
- Social preview metadata uses the canonical domain.
- Publishing metadata links back to the canonical site.

After verification, update the primary URL in Base.dev and the website field in
the Talent project.

Source: [Vercel — Set up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain).
