// ADR 0002 and ADR 0011: the routes the Worker build renders on demand, read from the route manifest Astro serializes
// into dist/server/entry.mjs. It holds the routes Astro injects on its own too, which src/pages does not show.

const MANIFEST = /deserializeManifest\((\{.*\})\);?$/m;

/** Each route of the build that is not prerendered, as { route, origin }; origin is "internal" when Astro injected it. */
export function onDemandRoutes(entry) {
  const manifest = MANIFEST.exec(entry)?.[1];
  if (!manifest) throw new Error("no route manifest in the Worker build");
  return JSON.parse(manifest)
    .routes.map(({ routeData }) => routeData)
    .filter((route) => !route.prerender)
    .map(({ route, origin }) => ({ route, origin }));
}
