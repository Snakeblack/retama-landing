import { expect, type Page, test } from "@playwright/test";

// The contact form over the build (Contact.astro, src/scripts/contact.ts). Turnstile and /api/contact/ are doubles at
// the boundary: the widget's script is served from its real URL, so the CSP still decides whether it may run.
const TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js*";
// WhatsApp shows only in a build given PUBLIC_WHATSAPP_NUMBER: CI builds with a test number, a plain local run without.
const whatsappNumber = process.env.PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
// Each render and each reset hands out a new token, as the real widget does.
const fakeTurnstile = `
  let options, count = 0;
  const issue = () => setTimeout(() => options.callback("token-" + ++count), 0);
  window.turnstile = {
    render(container, given) { options = given; window.__turnstile = given; issue(); return "widget"; },
    reset() { issue(); },
  };
`;

const pages = [
  {
    path: "/",
    locale: "es",
    labels: { name: "Nombre", email: "Correo", message: "Cuéntanos tu proyecto", submit: "Enviar" },
    type: "Software a medida",
    done: "Recibido.",
    fail: {
      "rate-limited": "Espera un minuto",
      verification: "No hemos podido comprobar que eres una persona",
      unavailable: "El mensaje no ha salido",
    },
  },
  {
    path: "/en/",
    locale: "en",
    labels: { name: "Name", email: "Email", message: "Tell us about your project", submit: "Send" },
    type: "Custom software",
    done: "Received.",
    fail: {
      "rate-limited": "Wait a minute",
      verification: "We could not check that you are a person",
      unavailable: "The message did not go out",
    },
  },
] as const;

type Case = (typeof pages)[number];

const draft = {
  name: "Lucía Ortega",
  email: "lucia@ejemplo.es",
  message: "Tenemos los pedidos en tres Excel y queremos algo que lo haga solo.",
};

async function fill(page: Page, { labels, type }: Case) {
  await page.getByLabel(labels.name).fill(draft.name);
  await page.getByLabel(labels.email).fill(draft.email);
  await page.locator("[data-choice]", { hasText: type }).click();
  await page.getByLabel(labels.message).fill(draft.message);
}

/** Answers /api/contact/ with `status` and `body`, and returns the bodies it received. */
async function api(page: Page, status: number, body: unknown) {
  const sent: Record<string, unknown>[] = [];
  await page.route("**/api/contact/", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status, json: body });
  });
  return sent;
}

test.describe("formulario de contacto sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, labels } of pages) {
    test(`${path} trae el formulario en el HTML, con el botón desactivado y las vías directas`, async ({ page }) => {
      await page.goto(path);
      for (const label of [labels.name, labels.email, labels.message])
        await expect(page.getByLabel(label)).toBeVisible();
      await expect(page.locator("[data-choice]")).toHaveCount(5);
      await expect(page.getByRole("button", { name: labels.submit })).toBeDisabled();
      await expect(page.locator("[data-contact] noscript")).toHaveCount(1);
      await expect(page.locator("[data-contact-direct] a:not([data-booking-open])")).toHaveCount(
        whatsappNumber ? 2 : 1,
      );
      // Nothing the form holds can end up in a URL or in another page.
      await expect(page.locator("[data-contact] form")).not.toHaveAttribute("action");
    });
  }
});

test.describe("formulario de contacto", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(TURNSTILE, (route) => route.fulfill({ contentType: "text/javascript", body: fakeTurnstile }));
  });

  for (const testCase of pages) {
    const { path, locale, labels, done } = testCase;

    test(`${path} carga Turnstile solo al entrar en el formulario, invisible salvo que pida un clic`, async ({
      page,
    }) => {
      const loads: string[] = [];
      page.on("request", (request) => {
        if (request.url().startsWith("https://challenges.cloudflare.com/")) loads.push(request.url());
      });
      await page.goto(path);
      await page.waitForLoadState("load");
      expect(loads).toEqual([]);

      await page.getByLabel(labels.name).focus();
      await expect.poll(() => loads.length).toBe(1);
      // The request goes out before the script runs and renders: wait for the widget's options, not just the load.
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __turnstile?: Record<string, unknown> }).__turnstile))
        .toMatchObject({
          // A build without PUBLIC_TURNSTILE_SITE_KEY keeps Turnstile's test key, which always passes.
          sitekey: "1x00000000000000000000AA",
          action: "contact",
          appearance: "interaction-only",
          language: locale,
          "response-field": false,
        });
    });

    test(`${path} marca los campos que faltan al enviar y los suelta al corregirlos`, async ({ page }) => {
      const sent = await api(page, 200, { ok: true });
      await page.goto(path);
      await page.getByRole("button", { name: labels.submit }).click();

      for (const field of ["name", "email", "projectType", "message"]) {
        await expect(page.locator(`[data-error="${field}"]`)).toBeVisible();
      }
      const name = page.getByLabel(labels.name);
      await expect(name).toBeFocused();
      await expect(name).toHaveAttribute("aria-invalid", "true");
      await expect(name).toHaveAttribute("aria-describedby", "contact-name-error");
      await expect(page.locator("#contact-projectType")).toHaveAttribute(
        "aria-describedby",
        "contact-projectType-error",
      );

      await name.fill(draft.name);
      await expect(page.locator('[data-error="name"]')).toBeHidden();
      await expect(name).not.toHaveAttribute("aria-invalid");
      await expect(page.locator('[data-error="email"]')).toBeVisible();
      expect(sent).toEqual([]);
    });

    test(`${path} envía con el token y confirma a qué correo responderemos`, async ({ page }) => {
      const violations: string[] = [];
      page.on("console", (message) => {
        if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
      });
      const sent = await api(page, 200, { ok: true });
      await page.goto(path);
      await fill(page, testCase);
      await page.getByRole("button", { name: labels.submit }).click();

      const confirmation = page.locator("[data-contact-done]");
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toBeFocused();
      await expect(confirmation).toContainText(done);
      await expect(confirmation).toContainText(draft.email);
      await expect(page.locator("[data-contact] form")).toBeHidden();
      expect(sent).toEqual([
        {
          locale,
          website: "",
          name: draft.name,
          email: draft.email,
          projectType: "software",
          message: draft.message,
          turnstileToken: "token-1",
        },
      ]);
      expect(violations).toEqual([]);
    });

    for (const [status, body, kind] of [
      [429, { ok: false, error: "rate-limited" }, "rate-limited"],
      [403, { ok: false, error: "verification" }, "verification"],
      [502, { ok: false, error: "delivery" }, "unavailable"],
      [503, { ok: false, error: "unavailable" }, "unavailable"],
    ] as const) {
      test(`${path} ante un ${status} conserva lo escrito y ofrece el correo precargado y, si hay número, WhatsApp`, async ({
        page,
      }) => {
        const sent = await api(page, status, body);
        await page.goto(path);
        await fill(page, testCase);
        const submit = page.getByRole("button", { name: labels.submit });
        await submit.click();

        const failure = page.getByRole("alert");
        await expect(failure).toContainText(testCase.fail[kind]);
        await expect(page.getByLabel(labels.message)).toHaveValue(draft.message);
        const mail = failure.locator("[data-contact-mail]");
        const href = new URL((await mail.getAttribute("href")) ?? "");
        expect(href.searchParams.get("body")).toBe(`${draft.message}\n\n${draft.name}`);
        const chat = failure.locator('a[href^="https://wa.me/"]');
        if (whatsappNumber) await expect(chat).toHaveAttribute("href", `https://wa.me/${whatsappNumber}`);
        else await expect(chat).toHaveCount(0);

        // The token was spent: a second try sends a fresh one.
        await expect(submit).toBeEnabled();
        await submit.click();
        await expect.poll(() => sent.length).toBe(2);
        expect(sent.map((item) => item.turnstileToken)).toEqual(["token-1", "token-2"]);
      });
    }

    test(`${path} marca los campos que la función rechaza`, async ({ page }) => {
      await api(page, 400, { ok: false, error: "invalid", fields: ["email"] });
      await page.goto(path);
      await fill(page, testCase);
      await page.getByRole("button", { name: labels.submit }).click();

      await expect(page.locator('[data-error="email"]')).toBeVisible();
      await expect(page.getByLabel(labels.email)).toBeFocused();
      await expect(page.locator("[data-failure-ways]")).toBeHidden();
    });
  }

  test("sin Turnstile no envía y da la razón y las vías directas", async ({ page }) => {
    await page.unroute(TURNSTILE);
    await page.route(TURNSTILE, (route) => route.abort());
    const sent = await api(page, 200, { ok: true });
    await page.goto("/");
    await fill(page, pages[0]);
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByRole("alert")).toContainText(pages[0].fail.verification);
    await expect(page.locator("[data-failure-ways]")).toBeVisible();
    expect(sent).toEqual([]);
  });
});
