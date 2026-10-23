# domain

## Intent and acceptance

Serve the site on its definitive domain retama.dev: a Custom Domain on the Worker, retama.dev as the production origin for canonicals, hreflang, sitemap, robots.txt and llms.txt, and the workers.dev URL turned off while branch Previews keep working

Acceptance: https://retama.dev/ and https://retama.dev/en/ serve the site with every security header; canonicals, hreflang, sitemap, robots.txt and llms.txt name https://retama.dev; the production workers.dev URL no longer serves the site; branch Preview URLs still deploy

## Plan

- `wrangler.jsonc`: `routes` with the Custom Domain `retama.dev`, `workers_dev: false`, `preview_urls: true` kept
  explicit so branch Previews stay on workers.dev. Guarded by `tests/unit/wrangler-config.test.ts`.
- `astro.config.mjs`: the fallback origin becomes `https://retama.dev` (no SITE_URL is set in Workers Builds).
  Guarded by the E2E `el sitemap nombra el dominio de producción` in `tests/e2e/site.spec.ts`; the other E2E tie the
  canonicals, hreflang, robots.txt and llms.txt to the sitemap's URLs.
- `public/_headers`: only its comment; HSTS stays without preload because the whole .dev TLD is preloaded.
- Docs: platform and Turnstile rows of `docs/architecture/technical-baseline.md`, M6 of `docs/roadmap.md`.
- Dashboard steps, by the user: Turnstile widget hostname `retama.dev` (before the merge); zone `retama.dev`: AAAA
  `www` → `100::` proxied and a Redirect Rule `www.retama.dev/*` → `https://retama.dev/${1}` 301 keeping the query;
  managed robots.txt and AI bot blocking off; if the deploy cannot create the Custom Domain, add it in
  Settings → Domains & Routes.

## Decisions

- www.retama.dev answers with a 301 to https://retama.dev from a Redirect Rule of the zone (user, open facts).
- The Custom Domain is declared in wrangler.jsonc as the source of truth; if the Workers Builds token cannot create
  it, the user adds it by hand in the dashboard (user, open facts).
- The production workers.dev URL is turned off (user, M6 decisions).
- HSTS keeps no preload: the whole .dev TLD is on the browsers' preload list (Google security blog, 2017-09-27).
- `docs/architecture/technical-baseline.md` joins `contracts.documents` in `idd/config.yaml`: it records the platform,
  the domain and the integrations that astro.config and wrangler.jsonc set (user, 2026-10-23).
- Prior decision (memory): Dominio retama.dev registrado -> `dig NS retama.dev` gives the Cloudflare nameservers: current.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-23T19:10:21.924Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-23T19:10:21.924Z)
- ev-3: frozen-review for trust-review (2026-10-23T19:11:25.806Z, relayed)
- ev-4: check-run for checks-pass (2026-10-23T19:12:26.897Z)
- ev-5: contract-spec-and-test for contract-spec-and-test (2026-10-23T19:12:26.897Z)
- ev-6: adr-impact-declaration for adr-impact-declaration (2026-10-23T19:12:26.897Z)
- ev-7: living-doc-current for living-doc (2026-10-23T19:12:32.316Z)
<!-- ospec:evidence:end -->
