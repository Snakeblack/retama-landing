// ADR 0001: the JavaScript a page loads at start, that is its scripts and everything they import statically.
// Dynamic `import()` is deferred work (the 3D scene of ADR 0004) and is left out.

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
const PRELOAD = /<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g;
const STATIC_IMPORT = /(?:^|[;}\s])(?:import|export)\s*(?:[\w*{}\s,$]+from\s*)?["']([^"']+)["']/g;
const JAVASCRIPT_TYPES = new Set(["", "module", "text/javascript", "application/javascript"]);

const attribute = (attributes, name) => attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** Joins an import specifier to the file that imports it; paths are relative to the site root, without a slash. */
function resolve(from, specifier) {
  if (specifier.startsWith("/")) return specifier.slice(1);
  const parts = from.split("/").slice(0, -1);
  for (const part of specifier.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

/**
 * Lists what a page runs at start: each external script and its static imports, once each, read through
 * `read(path)`, plus each inline script as `<inline>` followed by its text.
 */
export function initialScripts(html, read) {
  const entries = [];
  const inline = [];
  for (const [, attributes = "", body = ""] of html.matchAll(SCRIPT)) {
    if (!JAVASCRIPT_TYPES.has(attribute(attributes, "type") ?? "")) continue;
    const src = attribute(attributes, "src");
    if (src) entries.push(resolve("", src));
    else if (body.trim()) inline.push(`<inline>${body}`);
  }
  for (const [, href = ""] of html.matchAll(PRELOAD)) entries.push(resolve("", href));

  const seen = new Set();
  const visit = (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    for (const [, specifier = ""] of read(path).matchAll(STATIC_IMPORT)) {
      if (specifier.startsWith(".") || specifier.startsWith("/")) visit(resolve(path, specifier));
    }
  };
  for (const entry of entries) visit(entry);
  return [...seen, ...inline];
}
