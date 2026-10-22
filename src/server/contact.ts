// The contact function behind /api/contact (ADR 0002): it checks the origin, rate-limits per IP,
// validates, drops the honeypot, verifies Turnstile (fail-closed) and hands the lead to Resend for the
// main and the backup inbox in one call. Nothing is stored and no log carries personal data (ADR 0003).
import { type ContactInput, type ParseResult, type ProjectType, parseContact } from "../lib/contact";

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const RESEND_URL = "https://api.resend.com/emails";
export const TIMEOUTS = { siteverify: 5000, resend: 8000 } as const;
/** The widget's action; siteverify must echo it back. */
export const TURNSTILE_ACTION = "contact";
export const MAX_BODY_BYTES = 16 * 1024;

export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Secrets (wrangler secret put) and the ratelimits binding of wrangler.jsonc. */
export interface ContactEnv {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  CONTACT_BACKUP?: string;
  CONTACT_LIMITER?: RateLimiter;
}

export interface ContactDeps {
  env: ContactEnv;
  fetch: typeof fetch;
  log: (line: string) => void;
}

type Outcome =
  | "sent"
  | "honeypot"
  | "origin"
  | "rate-limited"
  | "invalid"
  | "unavailable"
  | "verification"
  | "delivery";

const STATUS: Record<Outcome, number> = {
  sent: 200,
  honeypot: 200,
  origin: 403,
  "rate-limited": 429,
  invalid: 400,
  unavailable: 503,
  verification: 403,
  delivery: 502,
};

// The email goes to the owner, so it is always in Spanish.
const PROJECT_LABEL: Record<ProjectType, string> = {
  web: "Web y CMS",
  software: "Software a medida",
  agents: "Agentes y automatización",
  seo: "SEO y analítica",
  other: "Otro",
};
const LOCALE_LABEL = { es: "español", en: "inglés" } as const;

function reply(deps: ContactDeps, outcome: Outcome, extra: { fields?: string[]; status?: number } = {}): Response {
  // Only the outcome and a provider's status code: never a field, an address or the IP.
  deps.log(JSON.stringify({ event: "contact", outcome, ...(extra.status ? { status: extra.status } : {}) }));
  const ok = outcome === "sent" || outcome === "honeypot";
  const body = ok ? { ok } : { ok, error: outcome, ...(extra.fields ? { fields: extra.fields } : {}) };
  return Response.json(body, {
    status: STATUS[outcome],
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

/** The body as text, or undefined past MAX_BODY_BYTES: a declared length is refused unread, a stream is cut. */
async function boundedText(request: Request): Promise<string | undefined> {
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) return undefined;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function readBody(request: Request): Promise<ParseResult> {
  const text = await boundedText(request);
  if (text === undefined) return { ok: false, fields: [] };
  try {
    return parseContact(JSON.parse(text));
  } catch {
    return { ok: false, fields: [] };
  }
}

/** The limiter's key: an IPv4 address, or the /64 of an IPv6 one, since a client usually holds the whole /64. */
export function rateLimitKey(ip: string): string {
  if (ip === "") return "unknown";
  if (!ip.includes(":")) return ip;
  const [head = "", tail] = ip.toLowerCase().split("::");
  const left = head === "" ? [] : head.split(":");
  const right = tail ? tail.split(":") : [];
  const groups = tail === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill("0"), ...right];
  return `${groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

async function verified(deps: ContactDeps, secret: string, input: ContactInput, ip: string, hostname: string) {
  if (input.turnstileToken === "") return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", input.turnstileToken);
  if (ip) form.set("remoteip", ip);
  try {
    const response = await deps.fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUTS.siteverify),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown; hostname?: unknown; action?: unknown };
    return result.success === true && result.hostname === hostname && result.action === TURNSTILE_ACTION;
  } catch {
    return false;
  }
}

function email(input: ContactInput) {
  const project = PROJECT_LABEL[input.projectType];
  const name = input.name.replace(/[\r\n]+/g, " ");
  return {
    subject: `Nuevo contacto: ${project} — ${name}`,
    text: [
      `Nombre: ${name}`,
      `Email: ${input.email}`,
      `Proyecto: ${project}`,
      `Idioma: ${LOCALE_LABEL[input.locale]}`,
      "",
      input.message,
    ].join("\n"),
  };
}

export async function handleContact(request: Request, deps: ContactDeps): Promise<Response> {
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin) return reply(deps, "origin");

  const { env } = deps;
  if (!env.CONTACT_LIMITER) return reply(deps, "unavailable");
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const { success } = await env.CONTACT_LIMITER.limit({ key: rateLimitKey(ip) });
  if (!success) return reply(deps, "rate-limited");

  const parsed = await readBody(request);
  if (!parsed.ok) return reply(deps, "invalid", { fields: parsed.fields });
  const input = parsed.value;
  if (input.website !== "") return reply(deps, "honeypot");

  const { TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_FROM, CONTACT_TO, CONTACT_BACKUP } = env;
  if (!TURNSTILE_SECRET_KEY || !RESEND_API_KEY || !CONTACT_FROM || !CONTACT_TO || !CONTACT_BACKUP) {
    return reply(deps, "unavailable");
  }
  if (!(await verified(deps, TURNSTILE_SECRET_KEY, input, ip, url.hostname))) return reply(deps, "verification");

  try {
    const response = await deps.fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO, CONTACT_BACKUP],
        reply_to: input.email,
        ...email(input),
      }),
      signal: AbortSignal.timeout(TIMEOUTS.resend),
    });
    if (!response.ok) return reply(deps, "delivery", { status: response.status });
  } catch {
    return reply(deps, "delivery");
  }
  return reply(deps, "sent");
}
