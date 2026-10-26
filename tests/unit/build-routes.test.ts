import { describe, expect, it } from "vitest";
import { onDemandRoutes } from "../../scripts/lib/build-routes.mjs";

// The shape of dist/server/entry.mjs: the function, then its call with the serialized manifest on one line.
const entry = (routes: object[]) =>
  [
    "function deserializeManifest(serializedManifest) {",
    "  return serializedManifest;",
    "}",
    `var _manifest = deserializeManifest(${JSON.stringify({ adapterName: "@astrojs/cloudflare", routes })});`,
    "export { _manifest as manifest };",
  ].join("\n");

const route = (path: string, origin: string, prerender: boolean) => ({
  file: "",
  routeData: { route: path, origin, prerender, type: "endpoint", component: `src/pages${path}.ts` },
});

describe("onDemandRoutes", () => {
  it("lista las rutas del build que no se prerenderizan, también las que inyecta Astro", () => {
    const routes = [
      route("/_server-islands/[name]", "internal", false),
      route("/_image", "internal", false),
      route("/", "project", true),
      route("/api/contact", "project", false),
      route("/blog/rss.xml", "project", true),
    ];
    expect(onDemandRoutes(entry(routes))).toEqual([
      { route: "/_server-islands/[name]", origin: "internal" },
      { route: "/_image", origin: "internal" },
      { route: "/api/contact", origin: "project" },
    ]);
  });

  it("falla si el build no trae el manifiesto de rutas", () => {
    expect(() => onDemandRoutes("export default { fetch() {} };")).toThrow("no route manifest");
  });
});
