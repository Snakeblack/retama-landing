import { expect, type Page, test } from "@playwright/test";

const SCENE = "[data-scene]";
const CHUNK = /scene-(?:three|worker)[.-][\w-]+\.js$/;

/** Hides WebGPU, so the scene can only take the WebGL2 tier. */
const withoutWebGPU = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "gpu", { get: () => undefined });
  });

/**
 * The test browser draws WebGL2 in software, which the probe rightly turns down. Dropping the caveat flag lets it
 * pass, so the WebGL2 tier runs on it; `refuse` makes every WebGL2 context fail instead.
 */
const webgl2 = (page: Page, mode: "software" | "refuse") =>
  page.addInitScript((refuse) => {
    const original = HTMLCanvasElement.prototype.getContext;
    // biome-ignore lint/suspicious/noExplicitAny: forwards the overloads of getContext unchanged.
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: any) {
      if (type !== "webgl2") return original.call(this, type, options);
      if (refuse) return null;
      return original.call(this, type, { ...options, failIfMajorPerformanceCaveat: false });
    } as typeof original;
  }, mode === "refuse");

/** Requests for the deferred scene chunk. */
function chunkRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (CHUNK.test(new URL(request.url()).pathname)) requests.push(request.url());
  });
  return requests;
}

const settle = (page: Page) => page.waitForLoadState("load").then(() => page.waitForTimeout(2500));

test.describe("escena 3D progresiva (ADR 0004)", () => {
  test("ADR 0004: con movimiento reducido queda el póster y la escena no se descarga", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const requests = chunkRequests(page);
    await page.goto("/");
    await settle(page);
    await expect(page.locator("[data-retama-poster]")).toBeVisible();
    await expect(page.locator("[data-scene-canvas]")).toHaveCount(0);
    await expect(page.locator("[data-scene-pause]")).toBeHidden();
    expect(requests).toEqual([]);
  });

  test("ADR 0004: sin WebGPU ni una GPU que rinda queda el póster y la escena no se descarga", async ({ page }) => {
    await withoutWebGPU(page);
    await webgl2(page, "refuse");
    const requests = chunkRequests(page);
    await page.goto("/");
    await expect(page.locator(SCENE)).toHaveAttribute("data-scene-tier", "poster", { timeout: 10_000 });
    await expect(page.locator("[data-retama-poster]")).toBeVisible();
    await expect(page.locator("[data-scene-canvas]")).toHaveCount(0);
    await expect(page.locator("[data-scene-pause]")).toBeHidden();
    expect(requests).toEqual([]);
  });

  test("sin WebGPU la escena corre en WebGL2 tras la carga, sustituye al póster y se pausa al tocarla", async ({
    page,
  }) => {
    await withoutWebGPU(page);
    await webgl2(page, "software");
    const violations: string[] = [];
    await page.exposeFunction("reportViolation", (text: string) => violations.push(text));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        (window as unknown as { reportViolation: (text: string) => void }).reportViolation(
          `${event.violatedDirective} ${event.blockedURI}`,
        );
      });
    });
    await page.goto("/en/");
    const scene = page.locator(SCENE);
    await expect(scene).toHaveAttribute("data-scene-tier", "webgl2", { timeout: 10_000 });
    await expect(scene).toHaveAttribute("data-scene-state", "running", { timeout: 10_000 });
    const pause = page.locator("[data-scene-pause]");
    await expect(pause).toHaveAccessibleName("Pause the retama animation");
    await expect(pause).toHaveText("");
    await pause.click();
    await expect(pause).toHaveAccessibleName("Play the retama animation");
    await expect(page.locator("[data-scene-canvas]")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-retama-poster]")).toHaveCSS("opacity", "0");
    await pause.press("Enter");
    await expect(pause).toHaveAccessibleName("Pause the retama animation");
    expect(violations).toEqual([]);
  });

  test("si la escena se rinde (GPU lenta, dispositivo perdido o error), vuelve el póster", async ({ page }) => {
    await withoutWebGPU(page);
    await webgl2(page, "software");
    // The worker measures its own frames (tooSlow, unit-tested); here a stand-in answers as a slow GPU would.
    await page.addInitScript(() => {
      window.Worker = class extends EventTarget {
        postMessage(message: { type: string }) {
          if (message.type !== "start") return;
          const say = (type: string, after: number) =>
            setTimeout(() => this.dispatchEvent(new MessageEvent("message", { data: { type } })), after);
          say("running", 100);
          say("gave-up", 1000);
        }
        terminate() {}
      } as unknown as typeof Worker;
    });
    await page.goto("/");
    const scene = page.locator(SCENE);
    await expect(scene).toHaveAttribute("data-scene-state", "running", { timeout: 10_000 });
    await expect(scene).toHaveAttribute("data-scene-state", "poster", { timeout: 10_000 });
    await expect(page.locator("[data-retama-poster]")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-scene-pause]")).toBeHidden();
    await expect(page.locator("[data-scene-canvas]")).toHaveCount(0);
  });
});
