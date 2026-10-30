// Post-build steps over the static output in dist/client.
import { mkdir, readdir, readFile, rename, rmdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { en } from "../src/i18n/en.ts";
import { es } from "../src/i18n/es.ts";
import { extractMetaCsp, mergePolicies, serializePolicy } from "./lib/csp.mjs";
import { icons } from "./lib/icons.mjs";
import { ogImage, ogPageImage, ownImages, themeTokens } from "./lib/og-image.mjs";

const root = new URL("../dist/client/", import.meta.url).pathname;

// Directives a <meta> CSP ignores, so they only exist in the header. The violations go to /api/report/ (ADR 0011):
// report-to names the endpoint of the Reporting-Endpoints header (public/_headers); browsers without it use report-uri.
const HEADER_ONLY = ["frame-ancestors 'none'", "report-uri /api/report/", "report-to csp"];
const PLACEHOLDER = "__CSP__";

// Astro emits non-root 404 pages as <locale>/404/index.html; Workers'
// not_found_handling looks for <locale>/404.html.
async function flattenLocale404() {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = join(root, entry.name, "404");
    try {
      await rename(join(nested, "index.html"), join(root, entry.name, "404.html"));
      await rmdir(nested);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function cspHeader() {
  const files = (await readdir(root, { recursive: true })).filter((file) => file.endsWith(".html"));
  const policies = [];
  for (const file of files) {
    const policy = extractMetaCsp(await readFile(join(root, file), "utf8"));
    if (!policy) throw new Error(`${file} has no CSP meta; is security.csp enabled?`);
    policies.push(policy);
  }
  const header = serializePolicy(mergePolicies(policies, HEADER_ONLY));
  const path = join(root, "_headers");
  const rules = await readFile(path, "utf8");
  if (!rules.includes(PLACEHOLDER)) throw new Error(`_headers has no ${PLACEHOLDER} placeholder`);
  await writeFile(path, rules.replace(PLACEHOLDER, header));
}

// The Open Graph image of each language, og/<locale>.png, of each article, og/<locale>/<slug>.png, and of each service
// page, og/ at the page's path, which Base.astro declares (src/lib/seo.ts, openGraph). A failure fails the build: no
// page links an image that is not there.
async function ogImages() {
  const theme = themeTokens(await readFile(new URL("../src/styles/theme.css", import.meta.url), "utf8"));
  const copies = { es, en };
  await mkdir(join(root, "og"), { recursive: true });
  for (const [locale, copy] of Object.entries(copies))
    await writeFile(join(root, "og", `${locale}.png`), await ogImage(copy, theme));

  // Each article's and service page's own image, where its BlogPosting or its Service says it is (src/lib/seo.ts):
  // "Blog" over the article's headline, "Servicios" over the service's name.
  const labels = { BlogPosting: "nav.blog", Service: "nav.services" };
  const pages = (await readdir(root, { recursive: true })).filter((file) => file.endsWith(".html"));
  for (const page of pages)
    for (const { type, title, locale, image } of ownImages(await readFile(join(root, page), "utf8"))) {
      const file = join(root, new URL(image).pathname);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, await ogPageImage(copies[locale][labels[type]], title, theme));
    }
}

// favicon.ico and apple-touch-icon.png from the SVG icon, which Base.astro links and the JSON-LD names as the logo.
async function iconFiles() {
  const svg = await readFile(join(root, "favicon.svg"), "utf8");
  for (const [name, data] of Object.entries(await icons(svg))) await writeFile(join(root, name), data);
}

await flattenLocale404();
await cspHeader();
await ogImages();
await iconFiles();
