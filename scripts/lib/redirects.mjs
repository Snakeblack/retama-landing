// The _redirects of the static output, written by scripts/postbuild.mjs (owner, 2026-10-30): a page asked for without
// its final slash moves for good, with a 301, to its address with the slash. Without it, html_handling answers with a
// 307, a temporary move, and a search engine may keep both addresses. The assets answer it before the Worker, so it
// costs no invocation (ADR 0012). A path that is no page gets no line and keeps its direct 404.

/** The site path of each page among the output's files (relative, with "/"): each index.html at any depth. */
export function pagePaths(files) {
  return files
    .filter((file) => file === "index.html" || file.endsWith("/index.html"))
    .map((file) => `/${file.slice(0, -"index.html".length)}`)
    .sort();
}

/** The _redirects file: from each page's path without its final slash to the path with it. The root has no line. */
export function redirectsFile(paths) {
  return paths
    .filter((path) => path !== "/")
    .map((path) => `${path.slice(0, -1)} ${path} 301\n`)
    .join("");
}
