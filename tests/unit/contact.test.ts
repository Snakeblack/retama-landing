import { describe, expect, it } from "vitest";
import {
  type ContactDeps,
  type ContactEnv,
  contactHealth,
  handleContact,
  MAX_BODY_BYTES,
  RESEND_URL,
  rateLimitKey,
  SITEVERIFY_URL,
  TIMEOUTS,
} from "../../src/server/contact";

const origin = "https://retama.example";
const url = `${origin}/api/contact/`;
const ip = "203.0.113.7";

const body = {
  name: "Ana Pérez",
  email: "ana@example.com",
  projectType: "software",
  message: "Queremos sustituir la hoja de cálculo de pedidos.",
  locale: "en",
  website: "",
  turnstileToken: "token-ok",
};

const env: ContactEnv = {
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  RESEND_API_KEY: "resend-key",
  CONTACT_FROM: "Retama <web@retama.example>",
  CONTACT_TO: "hola@retama.example",
  CONTACT_BACKUP: "respaldo@retama.example",
};

const ELSEWHERE = "https://elsewhere.example/";
const moved = () => new Response(null, { status: 307, headers: { Location: ELSEWHERE } });

interface Call {
  url: string;
  init: RequestInit;
}

type Reply = Response | Error | ((init: RequestInit) => Response | Promise<Response>);

function setup(
  options: { env?: ContactEnv; limiter?: "allow" | "deny" | "missing"; siteverify?: Reply; resend?: Reply } = {},
) {
  const calls: Call[] = [];
  const logs: string[] = [];
  const errors: string[] = [];
  const keys: string[] = [];
  const replies: Record<string, Reply> = {
    [SITEVERIFY_URL]:
      options.siteverify ?? Response.json({ success: true, hostname: "retama.example", action: "contact" }),
    [RESEND_URL]: options.resend ?? Response.json({ id: "email-1" }),
    // Where a provider's redirect would lead: it answers as the real one would, so following it would pass.
    [ELSEWHERE]: (init) =>
      init.body instanceof FormData
        ? Response.json({ success: true, hostname: "retama.example", action: "contact" })
        : Response.json({ id: "email-1" }),
  };
  const limiter = options.limiter ?? "allow";
  const deps: ContactDeps = {
    env: {
      ...(options.env ?? env),
      ...(limiter === "missing"
        ? {}
        : {
            CONTACT_LIMITER: {
              limit: async ({ key }) => {
                keys.push(key);
                return { success: limiter === "allow" };
              },
            },
          }),
    },
    fetch: async function fetch(input, init = {}): Promise<Response> {
      const target = String(input);
      calls.push({ url: target, init });
      const reply = replies[target];
      if (reply === undefined) throw new Error(`unexpected fetch to ${target}`);
      if (reply instanceof Error) throw reply;
      const response = typeof reply === "function" ? await reply(init) : reply.clone();
      // Like the platform's fetch, it follows a 3xx unless told not to, with the same headers and body.
      const location = response.headers.get("Location");
      if (response.status >= 300 && response.status < 400 && location && init.redirect !== "manual") {
        return fetch(location, init);
      }
      return response;
    },
    log: (line) => logs.push(line),
    // Error lines are log lines too, kept apart to check their severity.
    error: (line) => {
      logs.push(line);
      errors.push(line);
    },
  };
  return { deps, calls, logs, errors, keys };
}

/** A body that never ends, in 1 KB chunks, counting how many were read. */
function endless() {
  let count = 0;
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        count++;
        controller.enqueue(new Uint8Array(1024).fill(32));
      },
    },
    // No chunk is pulled ahead of a read.
    { highWaterMark: 0 },
  );
  return { stream, pulls: () => count };
}

function streamed(stream: ReadableStream<Uint8Array>, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": ip, ...headers },
    body: stream,
    duplex: "half",
  } as RequestInit);
}

function post(payload: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": ip, ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

async function send(payload: unknown, options: Parameters<typeof setup>[0] = {}, headers = {}) {
  const context = setup(options);
  const response = await handleContact(post(payload, headers), context.deps);
  return { ...context, response, json: await response.json() };
}

const sent = (calls: Call[]) => calls.filter((call) => call.url === RESEND_URL);

describe("handleContact", () => {
  it("entrega el lead a la bandeja principal y a la de respaldo en una sola llamada", async () => {
    const { response, json, calls } = await send(body);
    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true });
    const [email] = sent(calls);
    expect(sent(calls)).toHaveLength(1);
    expect(new Headers(email?.init.headers).get("Authorization")).toBe("Bearer resend-key");
    const payload = JSON.parse(String(email?.init.body));
    expect(payload.from).toBe(env.CONTACT_FROM);
    expect(payload.to).toEqual(["hola@retama.example", "respaldo@retama.example"]);
    expect(payload.reply_to).toBe("ana@example.com");
  });

  it("escribe el email en español, en texto plano y con el idioma del visitante", async () => {
    const { calls } = await send(body);
    const payload = JSON.parse(String(sent(calls)[0]?.init.body));
    expect(payload.subject).toBe("Nuevo contacto: Software a medida — Ana Pérez");
    expect(payload.html).toBeUndefined();
    expect(payload.text).toContain("Ana Pérez");
    expect(payload.text).toContain("ana@example.com");
    expect(payload.text).toContain("Software a medida");
    expect(payload.text).toContain("Idioma: inglés");
    expect(payload.text).toContain(body.message);
  });

  it("quita los saltos de línea del nombre en el asunto", async () => {
    const { calls } = await send({ ...body, name: "Ana\r\nBcc: x@y.z" });
    expect(JSON.parse(String(sent(calls)[0]?.init.body)).subject).toBe(
      "Nuevo contacto: Software a medida — Ana Bcc: x@y.z",
    );
  });

  it("verifica el token con siteverify, con la IP del visitante", async () => {
    const { calls } = await send(body);
    const verify = calls.find((call) => call.url === SITEVERIFY_URL);
    const form = verify?.init.body as FormData;
    expect(form.get("secret")).toBe("turnstile-secret");
    expect(form.get("response")).toBe("token-ok");
    expect(form.get("remoteip")).toBe(ip);
  });

  it("responde sin caché ni rastreo de tipo", async () => {
    const { response } = await send(body);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Type")).toContain("application/json");
  });

  describe("origen", () => {
    it("rechaza un Origin de otro sitio sin gastar cupo ni llamar a nadie", async () => {
      const { response, json, calls, keys } = await send(body, {}, { Origin: "https://evil.example" });
      expect(response.status).toBe(403);
      expect(json).toEqual({ ok: false, error: "origin" });
      expect(calls).toEqual([]);
      expect(keys).toEqual([]);
    });

    it("rechaza una petición sin Origin", async () => {
      const context = setup();
      const request = post(body);
      request.headers.delete("Origin");
      const response = await handleContact(request, context.deps);
      expect(response.status).toBe(403);
    });
  });

  describe("límite de envíos", () => {
    it("cuenta por la IP del visitante", async () => {
      const { keys } = await send(body);
      expect(keys).toEqual([ip]);
    });

    it("cuenta una IPv6 por su prefijo /64, que un mismo cliente suele tener entero", async () => {
      const context = setup();
      for (const address of ["2001:db8:0:1::7", "2001:0DB8:0:1:ffff:1:2:3"]) {
        await handleContact(post(body, { "CF-Connecting-IP": address }), context.deps);
      }
      expect(context.keys).toEqual(["2001:db8:0:1::/64", "2001:db8:0:1::/64"]);
    });

    it("responde 429 al pasar el cupo, sin verificar ni enviar", async () => {
      const { response, json, calls } = await send(body, { limiter: "deny" });
      expect(response.status).toBe(429);
      expect(json).toEqual({ ok: false, error: "rate-limited" });
      expect(calls).toEqual([]);
    });

    it("sin el binding rechaza el envío (fail-closed)", async () => {
      const { response, json, calls } = await send(body, { limiter: "missing" });
      expect(response.status).toBe(503);
      expect(json).toEqual({ ok: false, error: "unavailable" });
      expect(calls).toEqual([]);
    });
  });

  describe("entrada", () => {
    it("responde 400 con los campos inválidos", async () => {
      const { response, json, calls } = await send({ ...body, email: "ana", message: "corto" });
      expect(response.status).toBe(400);
      expect(json).toEqual({ ok: false, error: "invalid", fields: ["email", "message"] });
      expect(calls).toEqual([]);
    });

    it("responde 400 a un cuerpo que no es JSON", async () => {
      const { response, json } = await send("name=Ana");
      expect(response.status).toBe(400);
      expect(json).toEqual({ ok: false, error: "invalid", fields: [] });
    });

    it("lee un cuerpo de 16 KB justos y rechaza uno de un byte más", async () => {
      // The honeypot pads the body, so a read body answers 200. The limit is in bytes, and the body has accents.
      const size = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;
      const padded = (bytes: number) => ({ ...body, website: "x".repeat(bytes - size(body)) });
      expect(size(padded(MAX_BODY_BYTES))).toBe(MAX_BODY_BYTES);
      expect((await send(padded(MAX_BODY_BYTES))).response.status).toBe(200);
      const over = await send(padded(MAX_BODY_BYTES + 1));
      expect(over.response.status).toBe(400);
      expect(over.json).toEqual({ ok: false, error: "invalid", fields: [] });
    });

    it("rechaza un Content-Length de más de 16 KB sin leer el cuerpo", async () => {
      const { stream, pulls } = endless();
      const response = await handleContact(
        streamed(stream, { "Content-Length": String(MAX_BODY_BYTES + 1) }),
        setup().deps,
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, error: "invalid", fields: [] });
      expect(pulls()).toBe(0);
    });

    it("deja de leer un cuerpo sin Content-Length al pasar de 16 KB", async () => {
      const { stream, pulls } = endless();
      const response = await handleContact(streamed(stream), setup().deps);
      expect(response.status).toBe(400);
      expect(pulls()).toBeLessThanOrEqual(MAX_BODY_BYTES / 1024 + 2);
    });
  });

  describe("honeypot", () => {
    it("finge un éxito sin verificar ni enviar", async () => {
      const { response, json, calls } = await send({ ...body, website: "https://spam.example" });
      expect(response.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(calls).toEqual([]);
    });
  });

  describe("configuración", () => {
    for (const key of [
      "TURNSTILE_SECRET_KEY",
      "RESEND_API_KEY",
      "CONTACT_FROM",
      "CONTACT_TO",
      "CONTACT_BACKUP",
    ] as const) {
      it(`sin ${key} responde 503 sin llamar a nadie`, async () => {
        const { [key]: _missing, ...rest } = env;
        const { response, json, calls } = await send(body, { env: rest });
        expect(response.status).toBe(503);
        expect(json).toEqual({ ok: false, error: "unavailable" });
        expect(calls).toEqual([]);
      });
    }
  });

  describe("verificación anti-bot (fail-closed)", () => {
    const rejected: [string, Parameters<typeof setup>[0], Record<string, unknown>?][] = [
      ["token ausente", {}, { turnstileToken: "" }],
      ["token inválido", { siteverify: Response.json({ success: false, "error-codes": ["invalid-input-response"] }) }],
      [
        "hostname de otro sitio",
        { siteverify: Response.json({ success: true, hostname: "evil.example", action: "contact" }) },
      ],
      [
        "acción distinta",
        { siteverify: Response.json({ success: true, hostname: "retama.example", action: "login" }) },
      ],
      ["siteverify con error HTTP", { siteverify: new Response("down", { status: 500 }) }],
      ["siteverify inalcanzable", { siteverify: new TypeError("network") }],
      ["siteverify con respuesta que no es JSON", { siteverify: new Response("<html>") }],
    ];
    for (const [label, options, change] of rejected) {
      it(`${label}: 403 y no envía`, async () => {
        const { response, json, calls } = await send({ ...body, ...change }, options);
        expect(response.status).toBe(403);
        expect(json).toEqual({ ok: false, error: "verification" });
        expect(sent(calls)).toEqual([]);
      });
    }

    it("no sigue una redirección de siteverify", async () => {
      const { response, json, calls } = await send(body, { siteverify: moved() });
      expect(response.status).toBe(403);
      expect(json).toEqual({ ok: false, error: "verification" });
      expect(calls.map((call) => call.url)).toEqual([SITEVERIFY_URL]);
    });

    it("no llama a siteverify cuando no hay token", async () => {
      const { calls } = await send({ ...body, turnstileToken: "" });
      expect(calls).toEqual([]);
    });

    it(`deja de esperar a siteverify a los ${TIMEOUTS.siteverify} ms`, async () => {
      let signal: AbortSignal | null | undefined;
      await send(body, {
        siteverify: (init) => {
          signal = init.signal;
          return Response.json({ success: true, hostname: "retama.example", action: "contact" });
        },
      });
      expect(signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("entrega", () => {
    for (const [label, resend] of [
      ["Resend con error HTTP", Response.json({ message: "invalid from" }, { status: 422 })],
      ["Resend inalcanzable", new TypeError("network")],
      ["Resend agota la espera", new DOMException("timed out", "TimeoutError")],
    ] as const) {
      it(`${label}: 502`, async () => {
        const { response, json } = await send(body, { resend });
        expect(response.status).toBe(502);
        expect(json).toEqual({ ok: false, error: "delivery" });
      });
    }

    // A redirect to another host would take the Authorization header with it.
    it("no sigue una redirección de Resend ni le pasa la clave a otro host", async () => {
      const { response, json, calls, logs } = await send(body, { resend: moved() });
      expect(response.status).toBe(502);
      expect(json).toEqual({ ok: false, error: "delivery" });
      expect(calls.map((call) => call.url)).toEqual([SITEVERIFY_URL, RESEND_URL]);
      expect(logs.map((line) => JSON.parse(line))).toEqual([{ event: "contact", outcome: "delivery", status: 307 }]);
    });

    it("pasa una señal de espera a Resend", async () => {
      let signal: AbortSignal | null | undefined;
      await send(body, {
        resend: (init) => {
          signal = init.signal;
          return Response.json({ id: "email-1" });
        },
      });
      expect(signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("registros sin datos personales (ADR 0003)", () => {
    const personal = [body.name, body.email, body.message, ip, "Ana", "ana@"];
    const scenarios: [string, unknown, Parameters<typeof setup>[0]][] = [
      ["éxito", body, {}],
      ["honeypot", { ...body, website: "spam" }, {}],
      ["entrada inválida", { ...body, email: "ana@" }, {}],
      ["límite", body, { limiter: "deny" }],
      ["verificación", body, { siteverify: Response.json({ success: false }) }],
      ["entrega", body, { resend: Response.json({ message: `bad ${body.email}` }, { status: 422 }) }],
      ["configuración", body, { env: {} }],
    ];
    for (const [label, payload, options] of scenarios) {
      it(`${label}: registra un resultado sin campos personales`, async () => {
        const { logs } = await send(payload, options);
        expect(logs).toHaveLength(1);
        const line = logs[0] ?? "";
        expect(JSON.parse(line)).toMatchObject({ event: "contact" });
        for (const value of personal) expect(line).not.toContain(value);
      });
    }

    it("registra el código de error del proveedor", async () => {
      const { logs } = await send(body, { resend: Response.json({}, { status: 422 }) });
      expect(JSON.parse(logs[0] ?? "")).toEqual({ event: "contact", outcome: "delivery", status: 422 });
    });
  });

  // Workers Logs muestra con severidad de error solo los fallos que piden actuar: falta configuración o
  // Resend no entrega. Los rechazos por el visitante o por bots siguen como información.
  describe("severidad en Workers Logs", () => {
    const failures: [string, unknown, Parameters<typeof setup>[0]][] = [
      ["configuración", body, { env: {} }],
      ["sin binding del límite", body, { limiter: "missing" }],
      ["entrega rechazada", body, { resend: Response.json({}, { status: 500 }) }],
      ["entrega sin respuesta", body, { resend: new Error("timeout") }],
    ];
    for (const [label, payload, options] of failures) {
      it(`${label}: registra con severidad de error`, async () => {
        const { logs, errors } = await send(payload, options);
        expect(errors).toEqual(logs);
        expect(errors).toHaveLength(1);
      });
    }

    const handled: [string, unknown, Parameters<typeof setup>[0]][] = [
      ["éxito", body, {}],
      ["honeypot", { ...body, website: "spam" }, {}],
      ["entrada inválida", { ...body, email: "ana@" }, {}],
      ["límite", body, { limiter: "deny" }],
      ["verificación", body, { siteverify: Response.json({ success: false }) }],
    ];
    for (const [label, payload, options] of handled) {
      it(`${label}: registra como información`, async () => {
        const { logs, errors } = await send(payload, options);
        expect(logs).toHaveLength(1);
        expect(errors).toEqual([]);
      });
    }

    it("un origen ajeno registra como información", async () => {
      const { logs, errors } = await send(body, {}, { Origin: "https://evil.example" });
      expect(logs).toHaveLength(1);
      expect(errors).toEqual([]);
    });
  });
});

// GET /api/contact/: la comprobación del uptime externo (UptimeRobot gratis solo hace GET y da por caído lo
// que no es 2xx). Mira la configuración sin llamar a terceros ni gastar el límite de envíos.
describe("contactHealth", () => {
  const limiter = () => {
    const keys: string[] = [];
    return {
      keys,
      CONTACT_LIMITER: {
        limit: async ({ key }: { key: string }) => {
          keys.push(key);
          return { success: true };
        },
      },
    };
  };

  it("responde 200 con los secretos y el binding del límite, sin gastar envíos", async () => {
    const { keys, CONTACT_LIMITER } = limiter();
    const response = contactHealth({ ...env, CONTACT_LIMITER });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(keys).toEqual([]);
  });

  for (const secret of Object.keys(env) as (keyof ContactEnv)[]) {
    it(`sin ${secret} responde 503 sin decir qué falta`, async () => {
      const { CONTACT_LIMITER } = limiter();
      const response = contactHealth({ ...env, [secret]: undefined, CONTACT_LIMITER });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
  }

  it("sin el binding del límite responde 503", async () => {
    const response = contactHealth(env);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
  });
});

describe("rateLimitKey", () => {
  it("deja una IPv4 tal cual", () => {
    expect(rateLimitKey("203.0.113.7")).toBe("203.0.113.7");
  });

  it("reduce una IPv6 a su /64, con o sin abreviar", () => {
    expect(rateLimitKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(rateLimitKey("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe("2001:db8:0:0::/64");
    expect(rateLimitKey("2001:db8:a:b::")).toBe("2001:db8:a:b::/64");
    expect(rateLimitKey("::1")).toBe("0:0:0:0::/64");
  });

  it("agrupa sin la IP en una sola cuenta", () => {
    expect(rateLimitKey("")).toBe("unknown");
  });
});
