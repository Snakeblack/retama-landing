import { expect, test } from "@playwright/test";

// The call booking over the build (Contact.astro, src/scripts/booking.ts). It waits for its flag, so these tests prove
// the state the build was made with: CI builds with PUBLIC_BOOKING=true, a plain local run with the default, off.
// Cal.com is a double at the boundary, served from its real URL so the CSP still decides whether it may be framed.
const booking = process.env.PUBLIC_BOOKING === "true";
const BOOKING_PAGE = "https://cal.com/retama/llamada";

const pages = [
  { path: "/", open: "Reservar una llamada", close: "Cerrar", frame: "Calendario para reservar una llamada" },
  { path: "/en/", open: "Book a call", close: "Close", frame: "Calendar to book a call" },
] as const;

// A service page offers the booking beside its action as a plain link, with no frame (owner, 2026-10-30).
const services = [
  { path: "/servicios/software-a-medida/", open: "Reservar una llamada" },
  { path: "/en/services/custom-software/", open: "Book a call" },
] as const;

test.describe("reserva de llamada desactivada", () => {
  test.skip(booking, "the build has the booking on");

  for (const { path, open } of pages) {
    test(`${path} no ofrece la reserva ni admite Cal.com en la CSP`, async ({ page }) => {
      const response = await page.goto(path);
      await expect(page.getByRole("link", { name: open })).toHaveCount(0);
      await expect(page.locator("[data-booking]")).toHaveCount(0);
      expect(response?.headers()["content-security-policy"]).not.toContain("cal.com");
    });
  }

  for (const { path, open } of services) {
    test(`${path} no ofrece la reserva`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("link", { name: open })).toHaveCount(0);
    });
  }
});

test.describe("reserva de llamada sin JavaScript (ADR 0001)", () => {
  test.skip(!booking, "the build has the booking off");
  test.use({ javaScriptEnabled: false });

  for (const { path, open } of pages) {
    test(`${path} ofrece la reserva como un enlace a Cal.com`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("[data-contact-direct]").getByRole("link", { name: open })).toHaveAttribute(
        "href",
        BOOKING_PAGE,
      );
      await expect(page.locator("[data-booking]")).toBeHidden();
    });
  }

  for (const { path, open } of services) {
    test(`${path} ofrece la reserva junto a Hablemos como un enlace a Cal.com, sin marco`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main").getByRole("link", { name: open })).toHaveAttribute("href", BOOKING_PAGE);
      await expect(page.locator("[data-booking]")).toHaveCount(0);
    });
  }
});

test.describe("reserva de llamada (ADR 0006, ADR 0007)", () => {
  test.skip(!booking, "the build has the booking off");

  for (const { path, open, close, frame } of pages) {
    test(`${path} carga el calendario solo al pedirlo, una vez, y devuelve el foco al cerrarlo`, async ({ page }) => {
      const loads: string[] = [];
      await page.route(`${BOOKING_PAGE}?*`, (route) => {
        loads.push(route.request().url());
        return route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><title>Cal.com</title><p>Calendario</p>",
        });
      });
      const violations: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) => {
          console.error(`Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI}`);
        });
      });
      page.on("console", (message) => {
        if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
      });

      await page.goto(path);
      await page.waitForLoadState("load");
      expect(loads).toEqual([]);

      const action = page.locator("[data-contact-direct]").getByRole("link", { name: open });
      await expect(action).toHaveAttribute("aria-expanded", "false");
      await action.click();

      const tile = page.locator("[data-booking]");
      await expect(tile).toBeVisible();
      await expect(action).toHaveAttribute("aria-expanded", "true");
      const calendar = tile.locator(`iframe[title="${frame}"]`);
      await expect(calendar).toBeFocused();
      await expect(page.frameLocator(`iframe[title="${frame}"]`).getByText("Calendario")).toBeVisible();
      const src = new URL((await calendar.getAttribute("src")) ?? "");
      expect(src.origin + src.pathname).toBe(BOOKING_PAGE);
      expect(src.searchParams.get("embed")).toBe("true");
      // Cal.com may run its page, post the booking form and open its links in a new tab, but never navigate this one.
      await expect(calendar).toHaveAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox",
      );
      expect(page.url()).toBe(new URL(path, page.url()).href);

      await tile.getByRole("button", { name: close }).click();
      await expect(tile).toBeHidden();
      await expect(action).toBeFocused();
      await expect(action).toHaveAttribute("aria-expanded", "false");

      await action.click();
      await expect(tile).toBeVisible();
      await expect(tile.locator("iframe")).toHaveCount(1);
      expect(loads).toHaveLength(1);
      expect(violations).toEqual([]);
    });
  }
});
