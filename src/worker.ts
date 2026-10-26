// The Worker's entry (wrangler.jsonc, main): Astro's handler for the routes rendered on demand, the static assets for
// any other request, and the security headers on all it answers (src/server/edge.ts).
import { handle } from "@astrojs/cloudflare/handler";
import { isOnDemand, secure } from "./server/edge";

interface WorkerEnv {
  /** dist/client, with its _headers and the 404 page of each language (wrangler.jsonc, assets). */
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: WorkerEnv, context: Parameters<typeof handle>[2]): Promise<Response> {
    // astro dev renders every page here, without the CSP, and serves the <Picture> images through /_image.
    if (import.meta.env.DEV) return handle(request, env, context);
    const { pathname } = new URL(request.url);
    return secure(isOnDemand(pathname) ? await handle(request, env, context) : await env.ASSETS.fetch(request));
  },
};
