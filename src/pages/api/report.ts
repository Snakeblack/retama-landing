// POST /api/report/: the second route rendered on demand (ADR 0011, which amends ADR 0002). It takes the client error
// reports of the pages and the browser's CSP violation reports, and writes each one to Workers Logs at warn severity.
//
// Request: a body of at most 8 KB, one of
//   application/json            { type: "error", page, message, file?, line?, column?, stack? } from src/scripts/report.ts,
//                               only with the site's Origin
//   application/reports+json    the Reporting API's list (report-to); only "csp-violation" entries count
//   application/csp-report      { "csp-report": { ... } } (report-uri)
// Responses, all without a body and with Cache-Control: no-store:
//   204   the reports were logged, or dropped: not JSON, another origin, another page, an unknown type
//   413   over 8 KB
//   429   over 20 reports a minute from one IPv4 address or IPv6 /64
//   503   the rate-limit binding is missing (logged at error severity)
// The behaviour lives in src/server/report.ts and src/lib/report.ts, and its contract test in tests/unit/report.test.ts.
import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { handleReport } from "../../server/report";

export const prerender = false;

export const POST: APIRoute = ({ request }) => handleReport(request, { env, warn: console.warn, error: console.error });
