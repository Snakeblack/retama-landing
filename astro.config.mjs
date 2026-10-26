// @ts-check
import { readFileSync } from "node:fs";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";
import { missingOwner } from "./scripts/lib/legal-owner.mjs";
import { unpinnedPnpm } from "./scripts/lib/pnpm-pin.mjs";
import { refusedSiteKey, TEST_SITE_KEY } from "./scripts/lib/turnstile-key.mjs";

// The legal notice must name its owner (LSSI art. 10): Workers Builds, which publishes the site, never builds without.
const missing = missingOwner(process.env);
if (missing.length > 0)
  throw new Error(`The legal notice needs its owner: set ${missing.join(" and ")} in Workers Builds.`);
// The contact widget must not publish a Turnstile test key, which always gives the same answer.
if (refusedSiteKey(process.env))
  throw new Error("The contact form needs a real Turnstile widget: set PUBLIC_TURNSTILE_SITE_KEY in Workers Builds.");
// pnpm no longer switches itself to the version package.json pins (pmOnFail in pnpm-workspace.yaml): the published site
// is built with that one or not at all.
const { packageManager } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const pnpm = unpinnedPnpm(process.env, packageManager);
if (pnpm) throw new Error(`Workers Builds must build with ${packageManager} (found: ${pnpm}): set PNPM_VERSION there.`);

// Production origin for canonicals, hreflang and the sitemap, the Custom Domain of wrangler.jsonc.
// SITE_URL overrides it.
const site = process.env.SITE_URL ?? "https://retama.dev";

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
  env: {
    schema: {
      // The call booking of the contact chapter: off until the Cal.com account exists. Set it to "true" in the build
      // environment (Workers Builds) to show it; the CSP admits Cal.com only then.
      PUBLIC_BOOKING: envField.boolean({ context: "client", access: "public", default: false }),
      // The site key of the Turnstile widget made by hand in the Cloudflare dashboard, set in the build environment
      // (Workers Builds). Without it the build keeps Turnstile's test key, which always passes: dev, CI and E2E. A
      // Workers Builds build refuses the test keys (scripts/lib/turnstile-key.mjs).
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: "client", access: "public", default: TEST_SITE_KEY }),
      // The owner's WhatsApp, international format (34…), set in the build environment (Workers Builds) so it stays out
      // of the public repository. Without it the page shows no WhatsApp.
      PUBLIC_WHATSAPP_NUMBER: envField.string({ context: "client", access: "public", optional: true }),
      // The token of the Cloudflare Web Analytics site of retama.dev (dashboard → Web Analytics → Manage site), set in
      // the build environment (Workers Builds). Without it no page loads the beacon (src/lib/analytics.ts).
      PUBLIC_CF_ANALYTICS_TOKEN: envField.string({ context: "client", access: "public", optional: true }),
      // The owner the legal notice names (src/lib/board.ts, owner), set in the build environment (Workers Builds) so it
      // stays out of the public repository: the name and the town, required there, and the NIF and the address once
      // they exist. Without a name or a town the notice names nobody.
      PUBLIC_LEGAL_NAME: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_LEGAL_TOWN: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_LEGAL_NIF: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_LEGAL_ADDRESS: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // DESIGN.md typefaces, self-hosted from the pinned Fontsource packages (no third-party request; font-src 'self').
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Stack Sans Headline",
      cssVariable: "--font-stack-sans-headline",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/stack-sans-headline/files/stack-sans-headline-latin-wght-normal.woff2"],
            weight: "200 700",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Stack Sans Text",
      cssVariable: "--font-stack-sans-text",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/stack-sans-text/files/stack-sans-text-latin-wght-normal.woff2"],
            weight: "200 700",
            style: "normal",
          },
        ],
      },
    },
  ],
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
        // ADR 0006 allowlist: Turnstile's widget for the contact form, loaded on the first focus in it. Contact.astro
        // adds the Cal.com booking page here only while PUBLIC_BOOKING is on.
        "frame-src https://challenges.cloudflare.com",
      ],
      scriptDirective: { resources: ["'self'", "https://challenges.cloudflare.com"] },
    },
  },
});
