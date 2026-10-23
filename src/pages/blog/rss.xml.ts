import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { articleSummaries } from "../../lib/articles";
import { feedOptions } from "../../lib/feed";

// The RSS of the Spanish blog: each article's summary and link (src/lib/feed.ts).
export const GET: APIRoute = async ({ site, url }) =>
  rss(feedOptions(site ?? new URL(url.origin), "es", await articleSummaries("es")));
