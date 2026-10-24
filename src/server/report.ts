// The report function behind /api/report (ADR 0011): it rate-limits per IP and per report, reads at most
// MAX_REPORT_BYTES and writes each valid report as one JSON line at warn severity in Workers Logs. Two senders: the
// pages' own script (src/scripts/report.ts), with the site's Origin, and the browser's CSP reports (report-to and
// report-uri of the header). A report it cannot use is dropped with the same 204, so a sender learns nothing from the
// answer, and a refusal writes no line of its own: the invocation log already has the status, and only a missing
// binding needs the owner. Nothing is stored and no line carries personal data (ADR 0003): src/lib/report.ts keeps
// paths, short messages and positions.
import { cspReport, errorReport, MAX_REPORT_BYTES, PAGE_REPORT_LIMIT, type RawError, type Report } from "../lib/report";
import { boundedText, type RateLimiter, rateLimitKey } from "./contact";

/** The ratelimits binding of wrangler.jsonc, its own counter apart from the contact's. */
export interface ReportEnv {
  REPORT_LIMITER?: RateLimiter;
}

export interface ReportDeps {
  env: ReportEnv;
  /** The reports themselves: Workers Logs shows them at warn severity. */
  warn: (line: string) => void;
  /** Lines Workers Logs shows at error severity: the failures that need the owner to act. */
  error: (line: string) => void;
}

type Outcome = "discarded" | "rate-limited" | "too-large" | "unavailable";

const STATUS: Record<Outcome, number> = { discarded: 204, "rate-limited": 429, "too-large": 413, unavailable: 503 };

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } as const;

function reply(status: number): Response {
  return new Response(null, { status, headers: HEADERS });
}

function refuse(deps: ReportDeps, outcome: Outcome): Response {
  if (outcome === "unavailable") deps.error(JSON.stringify({ event: "report", outcome }));
  return reply(STATUS[outcome]);
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/** The pages' own report: one error, sent from the site (the Origin header says so). */
function ownReport(body: unknown, origin: string): Report[] {
  const raw = record(body);
  if (raw.type !== "error") return [];
  const report = errorReport(raw as RawError, raw.page, origin);
  return report ? [report] : [];
}

/** application/reports+json, the Reporting API of report-to: a list, of which only CSP violations count. */
function reportingReports(body: unknown, origin: string): Report[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((entry) => {
    const { type, body: violation } = record(entry);
    if (type !== "csp-violation") return [];
    const { documentURL, effectiveDirective, blockedURL } = record(violation);
    const report = cspReport(documentURL, effectiveDirective, blockedURL, origin);
    return report ? [report] : [];
  });
}

/** application/csp-report, the older report-uri: one violation under "csp-report". */
function legacyReports(body: unknown, origin: string): Report[] {
  const violation = record(record(body)["csp-report"]);
  const directive = violation["effective-directive"] ?? violation["violated-directive"];
  const report = cspReport(violation["document-uri"], directive, violation["blocked-uri"], origin);
  return report ? [report] : [];
}

export async function handleReport(request: Request, deps: ReportDeps): Promise<Response> {
  const { origin } = new URL(request.url);
  const { REPORT_LIMITER } = deps.env;
  if (!REPORT_LIMITER) return refuse(deps, "unavailable");
  const key = rateLimitKey(request.headers.get("CF-Connecting-IP") ?? "");
  const { success } = await REPORT_LIMITER.limit({ key });
  if (!success) return refuse(deps, "rate-limited");

  const text = await boundedText(request, MAX_REPORT_BYTES);
  if (text === undefined) return refuse(deps, "too-large");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return refuse(deps, "discarded");
  }

  const type = (request.headers.get("Content-Type") ?? "").split(";")[0]?.trim().toLowerCase();
  const reports =
    type === "application/json"
      ? request.headers.get("Origin") === origin
        ? ownReport(body, origin)
        : []
      : type === "application/reports+json"
        ? reportingReports(body, origin)
        : type === "application/csp-report"
          ? legacyReports(body, origin)
          : [];
  if (reports.length === 0) return refuse(deps, "discarded");
  // The first report spends the count taken before reading the body; each further one takes its own, so the limiter
  // bounds the lines written and not the requests.
  for (const [index, report] of reports.slice(0, PAGE_REPORT_LIMIT).entries()) {
    if (index > 0 && !(await REPORT_LIMITER.limit({ key })).success) break;
    deps.warn(JSON.stringify({ event: "report", ...report }));
  }
  return reply(204);
}
