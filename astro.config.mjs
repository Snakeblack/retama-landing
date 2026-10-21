// @ts-check
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Production origin for canonicals, hreflang and the sitemap. SITE_URL overrides
// it; the fallback is the workers.dev URL until the domain lands (M6).
const site = process.env.SITE_URL ?? "https://retama-landing.retamozogpt.workers.dev";

export default defineConfig({
  site,
  trailingSlash: "always",
  // One small stylesheet: inlining it removes the render-blocking request (perf-mobile).
  build: { inlineStylesheets: "always" },
  // ADR 0003: no session KV binding is provisioned.
  session: false,
  adapter: cloudflare({
    // Build-time image transforms; no Cloudflare Images binding.
    imageService: "compile",
  }),
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "es", locales: { es: "es", en: "en" } },
      filter: (page) => !/\/404\/?$/.test(new URL(page).pathname),
    }),
  ],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
      ],
    },
  },
});
