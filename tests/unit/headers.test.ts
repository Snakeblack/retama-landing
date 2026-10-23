import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
});
