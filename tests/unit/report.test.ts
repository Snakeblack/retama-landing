import { describe, expect, it } from "vitest";
import {
  blockedSource,
  clip,
  createReporter,
  cspReport,
  type ErrorReport,
  errorReport,
  MAX_REPORT_BYTES,
  MAX_TEXT,
  PAGE_REPORT_LIMIT,
  type RawError,
} from "../../src/lib/report";
import { handleReport, type ReportDeps } from "../../src/server/report";

const origin = "https://retama.example";
const url = `${origin}/api/report/`;
const ip = "2001:db8:1:2:3:4:5:6";

describe("informe de un error de la página (ADR 0011)", () => {
  it("guarda la ruta, el mensaje, la posición y el primer marco de la pila, sin query ni fragmento", () => {
    const stack = [
      "TypeError: x is undefined",
      `    at open (${origin}/_astro/header.abc.js?v=2:12:34)`,
      `    at ${origin}/_astro/header.abc.js:40:2`,
    ].join("\n");
    expect(
      errorReport(
        {
          message: "TypeError: x is undefined",
          file: `${origin}/_astro/header.abc.js?v=2#x`,
          line: 12,
          column: 34,
          stack,
        },
        `${origin}/en/legal/?ref=mail#privacy`,
        origin,
      ),
    ).toEqual({
      type: "error",
      page: "/en/legal/",
      message: "TypeError: x is undefined",
      file: "/_astro/header.abc.js",
      line: 12,
      column: 34,
      stack: "at open (/_astro/header.abc.js:12:34)",
    });
  });

  it("lee el marco de Firefox y Safari (fn@url:línea:columna)", () => {
    const report = errorReport(
      { message: "boom", stack: `open@${origin}/_astro/header.js:3:9\n@${origin}/_astro/header.js:1:1` },
      `${origin}/`,
      origin,
    );
    expect(report?.stack).toBe("open@/_astro/header.js:3:9");
  });

  it("enmascara los correos y corta el mensaje a 300 caracteres en una línea", () => {
    expect(clip("No se pudo\n  enviar a ana.perez@example.com")).toBe("No se pudo enviar a [email]");
    expect(errorReport({ message: "x".repeat(1000) }, `${origin}/`, origin)?.message).toHaveLength(MAX_TEXT);
  });

  it("reduce las URLs del mensaje a ruta del sitio u origen, sin query ni fragmento", () => {
    const message = `Failed to fetch https://api.example/v1?token=abc#f, then ${origin}/contacto/?email=x and http://[x`;
    expect(errorReport({ message }, `${origin}/`, origin)?.message).toBe(
      "Failed to fetch https://api.example then /contacto/ and [url]",
    );
  });

  it("acota y enmascara la ruta de la página y del archivo", () => {
    const report = errorReport(
      { message: "boom", file: `${origin}/${"a".repeat(5000)}.js` },
      `${origin}/ana@example.com/x/ana%2Bb%40example.com/`,
      origin,
    );
    expect(report?.page).toBe("/[email]/x/[email]/");
    expect(report?.file).toHaveLength(MAX_TEXT);
  });

  it("lee en tiempo casi lineal un informe adversario de 8 KB", () => {
    const n = MAX_REPORT_BYTES;
    const inputs: [RawError, string][] = [
      [{ message: "a".repeat(n) }, `${origin}/`],
      [{ message: "a@".repeat(n / 2) }, `${origin}/`],
      [{ message: `${"a".repeat(n / 2)}@${"b".repeat(n / 2)}` }, `${origin}/`],
      [{ message: "a:/".repeat(n / 3) }, `${origin}/`],
      [{ message: "boom", stack: "@".repeat(n) }, `${origin}/`],
      [{ message: "boom", stack: "@:1:".repeat(n / 4) }, `${origin}/`],
      [{ message: "boom", stack: `at ${"a".repeat(n)}` }, `${origin}/`],
      [{ message: "boom", stack: `at ${"a://".repeat(n / 4)}(` }, `${origin}/`],
      [{ message: "boom", stack: `at ${"a://".repeat(n / 4)})` }, `${origin}/`],
      [{ message: "boom" }, `${origin}/${"a".repeat(n)}`],
    ];
    const read = () => {
      for (const [raw, page] of inputs) errorReport(raw, page, origin);
    };
    read();
    const start = performance.now();
    read();
    // About 1 ms each; with unbounded repetitions one of them alone took about 50 ms.
    expect(performance.now() - start).toBeLessThan(50);
  });

  it.each([
    ["sin mensaje", { message: "" }, `${origin}/`],
    ["el «Script error.» opaco de otro origen", { message: "Script error." }, `${origin}/`],
    ["un archivo de otro origen", { message: "boom", file: "https://cdn.example/x.js" }, `${origin}/`],
    ["una extensión del navegador", { message: "boom", file: "chrome-extension://abc/content.js" }, `${origin}/`],
    [
      "una pila que empieza en una extensión",
      { message: "boom", stack: "Error: boom\n    at run (moz-extension://abc/x.js:1:2)" },
      `${origin}/`,
    ],
    ["una página de otro origen", { message: "boom" }, "https://otro.example/"],
    ["una ruta que se escapa a otro origen", { message: "boom" }, "//otro.example/x"],
  ])("descarta %s", (_case, raw, page) => {
    expect(errorReport(raw, page, origin)).toBeNull();
  });

  it("ignora posiciones que no son enteros positivos", () => {
    expect(errorReport({ message: "boom", line: -1, column: "3" }, `${origin}/`, origin)).toEqual({
      type: "error",
      page: "/",
      message: "boom",
    });
  });
});

describe("origen bloqueado de una violación de la CSP", () => {
  it.each([
    ["https://evil.example/a/b.js?x=1", "https://evil.example"],
    ["inline", "inline"],
    ["eval", "eval"],
    ["data:image/png;base64,AAAA", "data:"],
    ["", "other"],
    [42, "other"],
  ])("%s → %s", (value, expected) => {
    expect(blockedSource(value)).toBe(expected);
  });

  it("acota el origen bloqueado y enmascara la ruta de la página", () => {
    const report = cspReport(
      `${origin}/ana@example.com/`,
      "img-src",
      `https://${"a".repeat(5000)}.example/x.png`,
      origin,
    );
    expect(report?.page).toBe("/[email]/");
    expect(report?.blocked).toHaveLength(MAX_TEXT);
  });
});

describe("envío desde la página", () => {
  const report = (message: string): ErrorReport => ({ type: "error", page: "/", message });

  it("manda cada mensaje una sola vez y como mucho 5 por carga de página", () => {
    const sent: string[] = [];
    const send = createReporter((body) => sent.push(body));
    send(report("a"));
    send(report("a"));
    send(null);
    for (const message of ["b", "c", "d", "e", "f", "g"]) send(report(message));
    expect(sent.map((body) => JSON.parse(body).message)).toEqual(["a", "b", "c", "d", "e"]);
    expect(sent).toHaveLength(PAGE_REPORT_LIMIT);
  });
});

/** `limiter`: how many counts the limiter still allows, or "missing" without the binding. */
function setup(limiter: number | "missing" = Infinity) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const keys: string[] = [];
  const deps: ReportDeps = {
    env:
      limiter === "missing"
        ? {}
        : {
            REPORT_LIMITER: {
              limit: async ({ key }) => {
                keys.push(key);
                return { success: keys.length <= limiter };
              },
            },
          },
    warn: (line) => warnings.push(line),
    error: (line) => errors.push(line),
  };
  return { deps, warnings, errors, keys };
}

function post(body: unknown, contentType: string, headers: Record<string, string> = { Origin: origin }) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": contentType, "CF-Connecting-IP": ip, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const ownReport = { type: "error", page: "/en/?q=1", message: "boom", file: "/_astro/a.js", line: 3, column: 4 };

describe("POST /api/report/ (ADR 0011)", () => {
  it("registra el informe de la página en severidad warn y responde 204 sin cuerpo", async () => {
    const { deps, warnings, errors, keys } = setup();
    const response = await handleReport(post(ownReport, "application/json"), deps);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(warnings.map((line) => JSON.parse(line))).toEqual([
      { event: "report", type: "error", page: "/en/", message: "boom", file: "/_astro/a.js", line: 3, column: 4 },
    ]);
    expect(errors).toEqual([]);
    expect(keys).toEqual(["2001:db8:1:2::/64"]);
  });

  it("normaliza en el servidor lo que manda la página: un correo en el mensaje no llega al log", async () => {
    const { deps, warnings } = setup();
    await handleReport(post({ ...ownReport, message: "falló ana@example.com", extra: "x" }, "application/json"), deps);
    expect(warnings.join("")).not.toContain("ana@example.com");
    expect(warnings.join("")).not.toContain("extra");
  });

  it.each([
    ["sin Origin", {}],
    ["con otro Origin", { Origin: "https://otro.example" }],
  ])("descarta el informe propio %s, con el mismo 204 y sin escribir ninguna línea", async (_case, headers) => {
    const { deps, warnings, errors } = setup();
    const response = await handleReport(post(ownReport, "application/json", headers), deps);
    expect(response.status).toBe(204);
    expect([warnings, errors]).toEqual([[], []]);
  });

  it("registra las violaciones de la CSP de report-to, solo de las páginas del sitio", async () => {
    const { deps, warnings } = setup();
    const reports = [
      {
        type: "csp-violation",
        url: `${origin}/legal/`,
        user_agent: "Mozilla/5.0",
        body: {
          documentURL: `${origin}/legal/?ref=x`,
          blockedURL: "https://evil.example/x.js",
          effectiveDirective: "script-src-elem",
          sample: "console.log(1)",
          referrer: "https://www.google.com/",
        },
      },
      {
        type: "csp-violation",
        body: { documentURL: "https://otro.example/", blockedURL: "inline", effectiveDirective: "script-src" },
      },
      { type: "deprecation", body: { id: "x" } },
    ];
    const response = await handleReport(post(reports, "application/reports+json", {}), deps);
    expect(response.status).toBe(204);
    expect(warnings.map((line) => JSON.parse(line))).toEqual([
      { event: "report", type: "csp", page: "/legal/", directive: "script-src-elem", blocked: "https://evil.example" },
    ]);
  });

  it("registra la violación de la CSP de report-uri", async () => {
    const { deps, warnings } = setup();
    const report = {
      "csp-report": {
        "document-uri": `${origin}/en/`,
        "violated-directive": "style-src-attr",
        "blocked-uri": "inline",
        "source-file": `${origin}/en/`,
      },
    };
    await handleReport(post(report, "application/csp-report; charset=utf-8", {}), deps);
    expect(warnings.map((line) => JSON.parse(line))).toEqual([
      { event: "report", type: "csp", page: "/en/", directive: "style-src-attr", blocked: "inline" },
    ]);
  });

  it(`registra como mucho ${PAGE_REPORT_LIMIT} informes por petición`, async () => {
    const { deps, warnings } = setup();
    const one = {
      type: "csp-violation",
      body: { documentURL: `${origin}/`, blockedURL: "eval", effectiveDirective: "script-src" },
    };
    await handleReport(post(Array(8).fill(one), "application/reports+json", {}), deps);
    expect(warnings).toHaveLength(PAGE_REPORT_LIMIT);
  });

  it("cuenta cada informe en el límite: una petición no escribe más líneas de las que quedan", async () => {
    const { deps, warnings, keys } = setup(3);
    const one = {
      type: "csp-violation",
      body: { documentURL: `${origin}/`, blockedURL: "eval", effectiveDirective: "script-src" },
    };
    const response = await handleReport(post(Array(5).fill(one), "application/reports+json", {}), deps);
    expect(response.status).toBe(204);
    expect(warnings).toHaveLength(3);
    expect(keys).toHaveLength(4);
  });

  it.each([
    ["un cuerpo que no es JSON", "{", "application/json"],
    ["un tipo de contenido desconocido", ownReport, "text/plain"],
    ["un informe de otro tipo", { ...ownReport, type: "other" }, "application/json"],
  ])("descarta %s con 204", async (_case, body, contentType) => {
    const { deps, warnings } = setup();
    expect((await handleReport(post(body, contentType), deps)).status).toBe(204);
    expect(warnings).toEqual([]);
  });

  it("responde 413 por encima de 8 KB, sin leerlo si lo declara", async () => {
    const { deps, warnings, errors } = setup();
    const big = { ...ownReport, stack: "x".repeat(MAX_REPORT_BYTES) };
    expect((await handleReport(post(big, "application/json"), deps)).status).toBe(413);
    const declared = post(ownReport, "application/json", {
      Origin: origin,
      "Content-Length": String(MAX_REPORT_BYTES + 1),
    });
    expect((await handleReport(declared, deps)).status).toBe(413);
    expect([warnings, errors]).toEqual([[], []]);
  });

  it("responde 429 por encima del límite, sin leer el cuerpo ni escribir ninguna línea", async () => {
    const { deps, warnings, errors } = setup(0);
    expect((await handleReport(post(ownReport, "application/json"), deps)).status).toBe(429);
    expect([warnings, errors]).toEqual([[], []]);
  });

  it("responde 503 sin el binding del límite y lo registra como error", async () => {
    const { deps, warnings, errors } = setup("missing");
    expect((await handleReport(post(ownReport, "application/json"), deps)).status).toBe(503);
    expect(warnings).toEqual([]);
    expect(errors.map((line) => JSON.parse(line))).toEqual([{ event: "report", outcome: "unavailable" }]);
  });
});
