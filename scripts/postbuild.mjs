// Post-build steps over the static output in dist/client.
import { readdir, rename, rmdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../dist/client/", import.meta.url).pathname;

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

await flattenLocale404();
