// CSP helpers for the post-build step. Astro's security.csp only emits a
// <meta http-equiv> per page; ADR 0006 delivers the policy as a static header.

const FORBIDDEN = ["'unsafe-inline'", "'unsafe-eval'"];

/** @param {string} html @returns {string | null} */
export function extractMetaCsp(html) {
  const meta = /<meta\s+http-equiv="content-security-policy"\s+content="([^"]*)"/i.exec(html);
  return meta ? (meta[1] ?? null) : null;
}

/** @param {Map<string, string[]>} merged @param {string} policy */
function addPolicy(merged, policy) {
  for (const directive of policy.split(";")) {
    const [name, ...sources] = directive.trim().split(/\s+/).filter(Boolean);
    if (!name) continue;
    const bad = sources.find((source) => FORBIDDEN.includes(source));
    if (bad) throw new Error(`CSP directive ${name} uses ${bad} (forbidden by ADR 0006)`);
    const known = merged.get(name) ?? [];
    for (const source of sources) if (!known.includes(source)) known.push(source);
    merged.set(name, known);
  }
}

/**
 * Unions every page policy into one. Cloudflare joins repeated _headers values
 * with commas, which would enforce several policies at once, so all pages share
 * one header policy; each page's own meta keeps it to its own hashes.
 * @param {string[]} policies @param {string[]} [extra] header-only directives
 * @returns {Map<string, string[]>}
 */
export function mergePolicies(policies, extra = []) {
  if (policies.length === 0) throw new Error("no CSP found in the build output");
  const merged = new Map();
  for (const policy of [...policies, ...extra]) addPolicy(merged, policy);
  return merged;
}

/** @param {Map<string, string[]>} policy @returns {string} */
export function serializePolicy(policy) {
  return [...policy].map(([name, sources]) => [name, ...sources].join(" ")).join("; ");
}
