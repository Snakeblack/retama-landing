import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "../../src/server/edge";

// public/_headers: a URL pattern at the line start, its headers indented below it, "#" comments.
const rules = new Map<string, Record<string, string>>();
let current: Record<string, string> = {};
for (const line of readFileSync(new URL("../../public/_headers", import.meta.url), "utf8").split("\n")) {
  if (!line.trim() || line.trimStart().startsWith("#")) continue;
  if (!/^\s/.test(line)) {
    current = {};
    rules.set(line.trim(), current);
  } else {
    const [name = "", ...value] = line.trim().split(":");
    current[name.toLowerCase()] = value.join(":").trim();
  }
}

describe("cabeceras de los archivos de texto", () => {
  // Workers static assets serves .txt as text/plain with no charset, and llms.txt is UTF-8 («Información»): without it
  // a browser may guess another encoding. wrangler dev adds the charset on its own, so only this file shows the gap.
  it.each(["/robots.txt", "/llms.txt"])("%s declara UTF-8", (path) => {
    expect(rules.get(path)).toEqual({ "content-type": "text/plain; charset=utf-8" });
  });

  it("las cabeceras de seguridad siguen en un único bloque /* (ADR 0006)", () => {
    expect(rules.get("/*")?.["content-security-policy"]).toBe("__CSP__");
    expect([...rules.values()].filter((headers) => "content-security-policy" in headers)).toHaveLength(1);
  });

  // The policy's report-to csp (scripts/postbuild.mjs) points here; relative, so each Preview reports to itself.
  it("las violaciones de la CSP van a /api/report/ de la propia web (ADR 0011)", () => {
    expect(rules.get("/*")?.["reporting-endpoints"]).toBe('csp="/api/report/"');
  });

  // _headers only reaches the static assets: the Worker adds the same ones to what it answers itself, with its own CSP.
  it("el Worker añade a sus respuestas las mismas cabeceras de seguridad (src/server/edge.ts)", () => {
    const pageOnly = ["content-security-policy", "reporting-endpoints"];
    const assets = Object.entries(rules.get("/*") ?? {}).filter(([name]) => !pageOnly.includes(name));
    const worker = Object.entries(SECURITY_HEADERS)
      .map(([name, value]) => [name.toLowerCase(), value])
      .filter(([name]) => name !== "content-security-policy");
    expect(Object.fromEntries(worker)).toEqual(Object.fromEntries(assets));
  });
});
