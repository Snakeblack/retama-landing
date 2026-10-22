// POST /api/contact/: the one route rendered on demand (ADR 0002). The trailing slash is the site's
// (trailingSlash: "always"); without it Astro answers with a redirect.
//
// Request: a same-origin JSON body of at most 16 KB (a larger Content-Length is refused unread), the
// fields of src/lib/contact.ts:
//   { name, email, projectType: "web" | "software" | "agents" | "seo" | "other", message,
//     locale: "es" | "en", website (honeypot, empty), turnstileToken }
// Responses, all JSON with Cache-Control: no-store:
//   200 { ok: true }                                     delivered to both inboxes, or the honeypot was filled
//   400 { ok: false, error: "invalid", fields: [...] }   invalid fields in form order; [] when the body is not JSON
//                                                        or is over 16 KB
//   403 { ok: false, error: "origin" }                   Origin missing or not this site
//   403 { ok: false, error: "verification" }             Turnstile token missing, rejected or not verifiable
//   429 { ok: false, error: "rate-limited" }             over 3 sends a minute from one IPv4 address or IPv6 /64
//   502 { ok: false, error: "delivery" }                 Resend refused the email or did not answer in 8 s
//   503 { ok: false, error: "unavailable" }              a secret or the rate-limit binding is missing
// The behaviour lives in src/server/contact.ts and its contract test in tests/unit/contact.test.ts.
import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { handleContact } from "../../server/contact";

export const prerender = false;

export const POST: APIRoute = ({ request }) =>
  handleContact(request, { env, fetch: (input, init) => fetch(input, init), log: console.log });
