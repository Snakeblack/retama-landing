# observability

## Intent and acceptance

Workers Logs y Traces activados en wrangler.jsonc, y /api/contact/ vigilable por un uptime externo gratuito (UptimeRobot) junto con / y /en/

Acceptance: El Worker desplegado tiene observability activa (logs y traces) y los fallos del contacto salen con severidad de error; UptimeRobot recibe 2xx en /, /en/ y en una comprobación GET de /api/contact/ que no llama a terceros ni revela datos; la línea base y el roadmap nombran UptimeRobot

## Plan

- `wrangler.jsonc`: `observability` with logs and traces at `head_sampling_rate: 1`, top level, so Previews log too.
  Guarded by `tests/unit/wrangler-config.test.ts`.
- `src/server/contact.ts`: `ContactDeps.error` for the failures that need the owner (`unavailable`, `delivery`);
  every other outcome stays on `log`. `contactHealth(env)`: 200 `{ ok: true }` with the five secrets and
  `CONTACT_LIMITER`, 503 `{ ok: false, error: "unavailable" }` otherwise, `no-store`, no third party, no send spent.
  Guarded by `tests/unit/contact.test.ts` (severity and health).
- `src/pages/api/contact.ts`: `GET` export on the same route and `error: console.error`; its header documents the
  GET contract. Wiring guarded by the E2E `GET responde a la comprobación de salud` in `tests/e2e/contact.spec.ts`.
- Docs: function, logs and uptime rows plus two technology records in `docs/architecture/technical-baseline.md`;
  M6 and the deferred-decisions row of `docs/roadmap.md`.
- Dashboard steps, by the user after the deploy: UptimeRobot account with three HTTP(S) monitors every 5 minutes on
  `https://retama.dev/`, `https://retama.dev/en/` and `https://retama.dev/api/contact/`, email alerts to the account,
  no status page.

## Decisions

- The API is watched with a GET health check on the same route, which checks the secrets and the binding and names
  none of them (user, open facts). UptimeRobot free only sends GET or HEAD and treats anything but 2xx/3xx as down.
- Only `unavailable` and `delivery` log at error severity; origin, invalid, rate-limited, verification, honeypot and
  sent stay as info (user, open facts).
- Logs and traces at 100 % sampling (user, open facts).
- UptimeRobot alerts by email to the account, without a public status page (user, open facts).
- The health check logs nothing of its own: Workers Logs already records each invocation with its status, and a line
  every 5 minutes would only add noise.
- Prior decision (memory): M6 order and UptimeRobot as the uptime provider (topic roadmap/m6-decisions): current.
