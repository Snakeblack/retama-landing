// Cloudflare Web Analytics (src/lib/analytics.ts): the beacon comes in after the page has loaded. Analytics.astro
// only includes this script when the build has the site's token.
import { PUBLIC_CF_ANALYTICS_TOKEN } from "astro:env/client";
import { analyticsToken, loadBeacon } from "../lib/analytics";

const token = analyticsToken(PUBLIC_CF_ANALYTICS_TOKEN);
if (token) loadBeacon(document, token);
