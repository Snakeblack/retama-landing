// Cloudflare Web Analytics (ADR 0007): aggregate visits and Web Vitals, without cookies or anything stored in the
// browser. The beacon goes in by hand, with the site's token from the build environment (PUBLIC_CF_ANALYTICS_TOKEN,
// astro.config.mjs), and only after the page has loaded, so it stays out of the start-up JavaScript of ADR 0001.

/** Cloudflare's beacon script. */
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

/** Where the beacon sends its measures on a site set up by hand (Cloudflare's /cdn-cgi/rum). */
export const BEACON_REPORT_ORIGIN = "https://cloudflareinsights.com";

/** The site's token trimmed, or null without one: then the page loads no beacon and the CSP admits nothing more. */
export function analyticsToken(token: string | undefined): string | null {
  const trimmed = token?.trim();
  return trimmed ? trimmed : null;
}

/** The beacon's settings, read by the beacon from its data-cf-beacon attribute. */
export function beaconConfig(token: string): string {
  return JSON.stringify({ token });
}

/** The CSP sources the beacon needs: its script's origin, and its report origin as a connection (ADR 0006). */
export function beaconCsp(): { script: string; connect: `connect-src ${string}` } {
  return { script: new URL(BEACON_SRC).origin, connect: `connect-src ${BEACON_REPORT_ORIGIN}` };
}

/** Adds the beacon to the document once the page has loaded, or at once if it already has. */
export function loadBeacon(doc: Document, token: string): void {
  const add = () => {
    const script = doc.createElement("script");
    script.defer = true;
    script.src = BEACON_SRC;
    script.dataset.cfBeacon = beaconConfig(token);
    doc.body.append(script);
  };
  if (doc.readyState === "complete") add();
  else doc.defaultView?.addEventListener("load", add, { once: true });
}
