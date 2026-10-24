// Client error reports (ADR 0011): what a page's uncaught JavaScript error becomes before it reaches /api/report/, and
// what the function keeps of it. Both sides run the same normalization, so a report a page did not build passes no
// more than one it did. Nothing personal goes in: the page and the file as short same-origin paths, without query or
// fragment, a short message with its URLs reduced the same way and any email address masked, the line, the column
// and the first frame of the stack.

/** Where the pages and the browser's own CSP reports send them (public/_headers, scripts/postbuild.mjs). */
export const REPORT_PATH = "/api/report/";
/** The largest body /api/report/ reads; a larger one is refused with 413. */
export const MAX_REPORT_BYTES = 8 * 1024;
/** The longest message or stack frame kept. */
export const MAX_TEXT = 300;
/** How many reports a page load sends at most, and how many a request may carry. */
export const PAGE_REPORT_LIMIT = 5;

export interface ErrorReport {
  type: "error";
  page: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface CspReport {
  type: "csp";
  page: string;
  directive: string;
  blocked: string;
}

export type Report = ErrorReport | CspReport;

/** What an error event or a rejection gives, as the page reads it or as the function receives it. */
export interface RawError {
  message?: unknown;
  file?: unknown;
  line?: unknown;
  column?: unknown;
  stack?: unknown;
}

// The regexes read up to MAX_REPORT_BYTES of what anyone may send, so each repetition is bounded: an unbounded one
// backtracks from every position, and 8 KB of it costs more CPU than a Worker gets.
// An address with a dotted domain, also percent-encoded in a path: a Firefox frame (fn@/path or fn@https://…) is not one.
const EMAIL = /[\w.%+-]{1,64}(?:@|%40)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){1,8}/gi;
// A URL in a stack frame, without the :line:column that follows it. It ends where its characters end, so a match
// never fails after a long scan.
const FRAME_URL = /([a-z][a-z0-9+.-]{0,31}:\/\/[^\s()]+?)(:\d+(?::\d+)?)?(?=[\s()]|$)/gi;
// A URL in the text of a message.
const TEXT_URL = /\b[a-z][a-z0-9+.-]{0,31}:\/\/[^\s"'<>()]+/gi;
// What a CSP report may name instead of a URL.
const BLOCKED_KEYWORDS = ["inline", "eval", "wasm-eval", "trusted-types-policy", "trusted-types-sink", "self"];

/** One line of at most MAX_TEXT characters, with every email address masked. */
export function clip(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(EMAIL, "[email]").slice(0, MAX_TEXT);
}

/** The path of a URL of the site, resolved against its origin and clipped; null when it belongs to another origin or scheme. */
export function sitePath(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? clip(url.pathname) : null;
  } catch {
    return null;
  }
}

/** `text` with each URL reduced to its path on the site or to its origin elsewhere, and «[url]» when it does not parse. */
function reduceUrls(text: string, origin: string): string {
  return text.replace(TEXT_URL, (value) => {
    try {
      return sitePath(value, origin) ?? new URL(value).origin;
    } catch {
      return "[url]";
    }
  });
}

/** The first frame of a stack, its URLs reduced to paths; null when that frame runs code of another origin. */
function firstFrame(stack: string, origin: string): string | null | undefined {
  const frame = stack
    .split("\n")
    .map((line) => line.trim())
    // V8 writes "at fn (url:line:column)" under a message line; Firefox and Safari write "fn@url:line:column".
    .find((line) => /^at\s/.test(line) || (line.includes("@") && /:\d+:\d+$/.test(line)));
  if (!frame) return undefined;
  let foreign = false;
  const reduced = frame.replace(FRAME_URL, (_match, url: string, position = "") => {
    const path = sitePath(url, origin);
    if (path === null) foreign = true;
    return `${path ?? ""}${position}`;
  });
  return foreign ? null : clip(reduced);
}

function position(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value < 1e7 ? value : undefined;
}

/**
 * The report of an uncaught error on `page`, or null for one not worth sending: no message, the opaque
 * «Script error.» of a script of another origin, or a file or first frame outside the site (a browser extension).
 */
export function errorReport(raw: RawError, page: unknown, origin: string): ErrorReport | null {
  const path = typeof page === "string" ? sitePath(page, origin) : null;
  const message = typeof raw.message === "string" ? clip(reduceUrls(raw.message, origin)) : "";
  if (path === null || message === "" || /^script error\.?$/i.test(message)) return null;
  const report: ErrorReport = { type: "error", page: path, message };
  if (typeof raw.file === "string" && raw.file !== "") {
    const file = sitePath(raw.file, origin);
    if (file === null) return null;
    report.file = file;
  }
  const line = position(raw.line);
  const column = position(raw.column);
  if (line) report.line = line;
  if (column) report.column = column;
  if (typeof raw.stack === "string") {
    const frame = firstFrame(raw.stack, origin);
    if (frame === null) return null;
    if (frame) report.stack = frame;
  }
  return report;
}

/** What a CSP violation blocked: the origin of a URL, the scheme of data: or blob:, or the browser's keyword. */
export function blockedSource(value: unknown): string {
  if (typeof value !== "string" || value === "") return "other";
  const keyword = value.toLowerCase();
  if (BLOCKED_KEYWORDS.includes(keyword)) return keyword;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? clip(url.origin) : url.protocol;
  } catch {
    return "other";
  }
}

/** The report of a CSP violation on a page of the site, or null when the page is not one or the directive is odd. */
export function cspReport(page: unknown, directive: unknown, blocked: unknown, origin: string): CspReport | null {
  const path = typeof page === "string" ? sitePath(page, origin) : null;
  const name = typeof directive === "string" ? directive.trim().split(/\s+/)[0] : undefined;
  if (path === null || !name || !/^[a-z-]{1,40}$/.test(name)) return null;
  return { type: "csp", page: path, directive: name, blocked: blockedSource(blocked) };
}

/**
 * The page side: sends each report as JSON through `send`, each message only once and at most PAGE_REPORT_LIMIT a
 * page load, so a loop of errors costs one request.
 */
export function createReporter(send: (body: string) => void): (report: ErrorReport | null) => void {
  const sent = new Set<string>();
  return (report) => {
    if (!report || sent.size >= PAGE_REPORT_LIMIT || sent.has(report.message)) return;
    sent.add(report.message);
    send(JSON.stringify(report));
  };
}
