// What the Worker (src/worker.ts) does around Astro: it hands Astro only the routes rendered on demand, and it adds the
// security headers of public/_headers, which Cloudflare applies to the static assets alone, to all it answers.

/**
 * ADR 0002 and ADR 0011. Astro and the adapter inject two more into every build, which the site does not use: the
 * image endpoint (/_image), since images are compiled at build, and the server islands (/_server-islands/[name]),
 * since no component is server:defer. scripts/fitness.mjs keeps this list equal to the ADRs'.
 */
export const ON_DEMAND_ROUTES = ["/api/contact", "/api/report"] as const;

/**
 * The /* block of public/_headers but its page CSP and Reporting-Endpoints (tests/unit/edge.test.ts keeps them equal).
 * The Worker's own answers are JSON, empty bodies and redirects, never a page: their CSP lets them load nothing.
 */
export const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
} as const;

/**
 * Whether the path, as the request sends it, is a route on demand, with or without the site's trailing slash (Astro
 * redirects the one without). An encoded path never is: Astro would decode it, and it could reach another route.
 */
export function isOnDemand(pathname: string): boolean {
  return ON_DEMAND_ROUTES.some((route) => pathname === route || pathname === `${route}/`);
}

/** The response with every security header it lacks; the ones it has, such as an asset's page CSP, stay. */
export function secure(response: Response): Response {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!secured.headers.has(name)) secured.headers.set(name, value);
  }
  return secured;
}
