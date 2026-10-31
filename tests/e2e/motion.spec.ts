import { expect, type Page, test } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };

const tileOpacities = (page: Page) =>
  page
    .locator("main section[id] > *")
    .evaluateAll((tiles) => tiles.map((tile) => Number(getComputedStyle(tile).opacity)));

/** Whether anything draws over the words of the title but their own letters: a layer or a texture. */
const titleTexture = (page: Page) =>
  page.locator("[data-glyph-word]").evaluateAll((words) =>
    words.some((word) => {
      const after = getComputedStyle(word, "::after");
      return after.content !== "none" || getComputedStyle(word).backgroundImage !== "none";
    }),
  );

const talkOpacity = (page: Page) =>
  page.locator("[data-talk]").evaluate((talk) => Number(getComputedStyle(talk).opacity));

const TABS = "[data-sectors] > details";

/** Index of the open sector of the switcher. */
const openSector = (page: Page) =>
  page.locator(TABS).evaluateAll((tabs) => tabs.findIndex((tab) => (tab as HTMLDetailsElement).open));

/** Status texts of the live rows of the open sector. */
const liveStatuses = (page: Page) =>
  page
    .locator(`${TABS}[open] [data-live] [data-live-text]`)
    .evaluateAll((cells) => cells.map((cell) => cell.textContent));

async function showSectors(page: Page) {
  await page
    .locator("#sectores, #sectors")
    .first()
    .evaluate((group) => group.scrollIntoView());
}

/** Waits until the motion layer has set the switcher up: it puts the progress of the tour on the bars. */
const sectorsReady = (page: Page) =>
  expect(page.locator("[data-sectors-progress]").first()).toHaveAttribute("style", /--progress/);

/**
 * Holds back the scripts of the build that carry GSAP (its ScrollTrigger), so the page can be used before the motion
 * layer arrives; the function it returns lets them in and waits until the layer has set the switcher up.
 */
async function holdMotion(page: Page) {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes("ScrollTrigger")) await held;
    await route.fulfill({ response, body });
  });
  return async () => {
    release();
    await sectorsReady(page);
  };
}

async function scrollThrough(page: Page) {
  for (const group of await page.locator("main section[id]").all()) await group.scrollIntoViewIfNeeded();
  await page.keyboard.press("End");
}

/** The scripts of the build the page has fetched that carry GSAP (its ScrollTrigger), with when each was asked for. */
async function gsapScripts(page: Page) {
  const scripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => new URL(entry.name).pathname.match(/^\/_astro\/.*\.js$/))
      .map((entry) => ({ url: entry.name, start: entry.startTime })),
  );
  const bodies = await Promise.all(scripts.map(async ({ url }) => (await page.request.get(url)).text()));
  return scripts.filter((_, index) => bodies[index]?.includes("ScrollTrigger"));
}

const firstContentfulPaint = (page: Page) =>
  page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? Number.NaN);

test.describe("movimiento en escritorio (DESIGN.md Motion)", () => {
  test.use({ viewport: desktop });

  // scenario:perf-mobile: a script asked for at high priority that is in before the first paint counts in the first and
  // largest paints Lighthouse simulates, and GSAP is most of the page's JavaScript.
  for (const path of ["/", "/en/"]) {
    test(`${path} pide GSAP después del primer pintado, fuera del script de arranque`, async ({ page }) => {
      await page.goto(path);
      await expect.poll(async () => (await gsapScripts(page)).length).toBeGreaterThan(0);
      const paint = await firstContentfulPaint(page);
      for (const { url, start } of await gsapScripts(page)) expect(start, url).toBeGreaterThan(paint);
    });
  }

  test("la cifra cuenta y el texto se puede seleccionar, salvo el título", async ({ page }) => {
    await page.goto("/");
    const select = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).userSelect);
    expect(await select("main h1")).toBe("none");
    expect(await select('[data-chapter="hero"] p')).not.toBe("none");
    await page.locator("[data-count]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-count]")).toHaveText("100");
  });

  test("el título se pinta en letras, sin la textura de código", async ({ page }) => {
    await page.goto("/");
    expect(await titleTexture(page)).toBe(false);
    expect((await page.request.get("/code-lens.svg")).status()).toBe(404);
  });

  test("el manifiesto pasa de gris a tinta palabra a palabra al subir", async ({ page }) => {
    await page.goto("/");
    const words = page.locator("[data-manifesto] [data-word]");
    const opacities = () => words.evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)));
    // The motion layer comes after the first paint.
    await expect.poll(async () => Math.max(...(await opacities()))).toBeLessThan(1);
    await page.locator("[data-manifesto]").last().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 600);
    await expect.poll(async () => Math.min(...(await opacities()))).toBe(1);
  });

  test("«Hablemos» fijo se esconde sobre el hero y el contacto y aparece entre medias", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-talk]")).toHaveAttribute("href", "#contacto");
    // The scroll timeline resolves on the first frames after load.
    await expect.poll(() => talkOpacity(page)).toBe(0);
    await page.locator("#servicios").scrollIntoViewIfNeeded();
    await expect.poll(() => talkOpacity(page)).toBe(1);
    await page.locator("#contacto").scrollIntoViewIfNeeded();
    await expect.poll(() => talkOpacity(page)).toBe(0);
    // Faded out it is hidden too, so the keyboard never lands on an invisible button.
    await expect(page.locator("[data-talk]")).toBeHidden();
  });

  test("la S de «Software» empieza en la columna de la «h» de «hecho a medida»", async ({ page }) => {
    await page.goto("/");
    const ink = (selector: string) =>
      page.locator(selector).evaluate((node) => {
        const style = getComputedStyle(node);
        const context = document.createElement("canvas").getContext("2d");
        if (!context) return 0;
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const text = (node.textContent ?? "").trim();
        return node.getBoundingClientRect().left - context.measureText(text).actualBoundingBoxLeft;
      });
    await page.evaluate(() => document.fonts.ready);
    const [word, rest] = await Promise.all([
      ink("[data-glyph-word]:not([data-glyph-accent])"),
      ink("[data-glyph-accent]"),
    ]);
    expect(Math.abs(word - rest)).toBeLessThanOrEqual(1);
  });

  test("Sectores cabe en una pantalla, sin pin, y la vuelta avanza sola con fragmentos vivos", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    expect((await page.locator("#sectores").boundingBox())?.height).toBeLessThan(desktop.height);
    const before = await liveStatuses(page);
    await showSectors(page);
    // The open fragment comes alive: a row moves to its next status.
    await expect.poll(() => liveStatuses(page), { timeout: 4000 }).not.toEqual(before);
    await expect.poll(() => openSector(page), { timeout: 9000 }).toBe(1);
  });

  test("elegir un sector detiene la vuelta y la pestaña abierta no se cierra", async ({ page }) => {
    await page.goto("/");
    await sectorsReady(page);
    await showSectors(page);
    const summaries = page.locator(`${TABS} > summary`);
    await summaries.nth(2).click();
    await expect.poll(() => openSector(page)).toBe(2);
    await summaries.nth(2).click();
    await page.waitForTimeout(7000);
    expect(await openSector(page)).toBe(2);
  });

  // The motion layer comes after the first paint (Home.astro), so the visitor can use the switcher before it. Pointer
  // and focus leave the switcher, so only the choice can keep the tour from running.
  for (const [state, pressed, open] of [
    ["elegido", 2, 2],
    ["cerrado", 0, -1],
  ] as const) {
    test(`un sector ${state} antes de que llegue el movimiento se queda así, sin vuelta`, async ({ page }) => {
      const letMotionIn = await holdMotion(page);
      await page.goto("/");
      await showSectors(page);
      const summary = page.locator(`${TABS} > summary`).nth(pressed);
      await summary.click();
      await summary.blur();
      await page.mouse.move(0, 0);
      expect(await openSector(page)).toBe(open);
      await letMotionIn();
      await page.waitForTimeout(7000);
      expect(await openSector(page)).toBe(open);
    });
  }

  test("con el puntero sobre el selector cuando llega el movimiento, la vuelta espera a que se vaya", async ({
    page,
  }) => {
    const letMotionIn = await holdMotion(page);
    await page.goto("/");
    await showSectors(page);
    await page.locator(`${TABS} > summary`).nth(2).hover();
    await letMotionIn();
    await page.waitForTimeout(7000);
    expect(await openSector(page)).toBe(0);
    await page.mouse.move(0, 0);
    await expect.poll(() => openSector(page), { timeout: 9000 }).toBe(1);
  });

  test("cada grupo entra una vez al llegar y al final todo queda visible", async ({ page }) => {
    await page.goto("/");
    await expect.poll(async () => (await tileOpacities(page)).some((opacity) => opacity < 1)).toBe(true);

    await scrollThrough(page);
    await expect.poll(async () => (await tileOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
  });

  test("lo que ya está en pantalla cuando llega el movimiento se queda como viene, sin entrada ni cuenta", async ({
    page,
  }) => {
    // Every text the figure takes, the one the parser writes included.
    await page.addInitScript(() => {
      const texts: string[] = [];
      Object.assign(window, { counted: texts });
      new MutationObserver((records) => {
        for (const { target } of records) {
          const figure = (target instanceof Element ? target : target.parentElement)?.closest("[data-count]");
          if (figure) texts.push(figure.textContent ?? "");
        }
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await page.goto("/#metodo");
    // The layer has come: the contact, below the screen, waits hidden for its entrance; the rest are steps of a task.
    const contact = page.locator("#contacto > *");
    await expect
      .poll(() => contact.evaluateAll((tiles) => tiles.some((tile) => getComputedStyle(tile).opacity !== "1")))
      .toBe(true);
    await page.waitForTimeout(500);

    // The chapters on screen and above it: no tile or row of theirs got a starting state.
    const started = await page
      .locator("#servicios, #sectores, #metodo")
      .evaluateAll(
        (groups) =>
          groups.flatMap((group) =>
            [...group.querySelectorAll<HTMLElement>("*")].filter(
              ({ style }) => style.opacity !== "" || style.transform !== "" || style.clipPath !== "",
            ),
          ).length,
      );
    expect(started).toBe(0);
    await expect(page.locator("[data-count]")).toHaveText("100");
    const counted = await page.evaluate(() => (window as unknown as { counted: string[] }).counted);
    expect(new Set(counted.map((text) => text.trim()))).toEqual(new Set(["100"]));
  });
});

test.describe("movimiento en el móvil (DESIGN.md Motion)", () => {
  test.use({ viewport: phone, hasTouch: true, isMobile: true });

  test("la palabra cabe en la pantalla", async ({ page }) => {
    await page.goto("/");
    const word = await page.locator("[data-glyph-word]").first().boundingBox();
    expect((word?.x ?? 0) + (word?.width ?? 0)).toBeLessThanOrEqual(phone.width);
  });

  // The scene samples each line of the title as one line of text (scene.ts, sampleWord).
  test("cada renglón del título cabe en una línea, también a 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ["/", "/en/"]) {
      await page.goto(path);
      const lines = await page
        .locator("[data-glyph-word]")
        .evaluateAll((words) =>
          words.map((word) =>
            Math.round(word.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(word).lineHeight)),
          ),
        );
      expect(lines, path).toEqual([1, 1]);
    }
  });

  test("el manifiesto se lee a tamaño de titular y cada frase cabe en tres líneas", async ({ page }) => {
    await page.goto("/");
    const lines = await page.locator("[data-manifesto]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        const size = Number.parseFloat(style.fontSize);
        const height = style.getPropertyValue("--text-headline-sm");
        return {
          size,
          token: Number.parseFloat(height),
          lines: Math.round(node.clientHeight / Number.parseFloat(style.lineHeight)),
        };
      }),
    );
    for (const { size, token, lines: count } of lines) {
      expect(size).toBe(token);
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  test("Sectores lleva las pestañas en 2×2, la vuelta avanza y la marca blanca cambia de marca", async ({ page }) => {
    await page.goto("/");
    const tabs = page.locator(`${TABS} > summary`);
    const [first, second, third] = await Promise.all([0, 1, 2].map((index) => tabs.nth(index).boundingBox()));
    expect(second?.y).toBe(first?.y);
    expect(third?.x).toBe(first?.x);
    expect(third?.y).toBeGreaterThan(first?.y ?? 0);
    await showSectors(page);
    await expect.poll(() => openSector(page), { timeout: 9000 }).toBe(1);
    await tabs.nth(3).click();
    const marks = page.locator("[data-portal] [data-brand-mark]");
    await expect(marks.nth(1)).toHaveAttribute("data-active", "", { timeout: 4000 });
  });

  test("el texto del tablero no se selecciona, salvo el contacto", async ({ page }) => {
    await page.goto("/");
    const select = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).userSelect);
    expect(await select("main h1")).toBe("none");
    expect(await select("footer p")).toBe("none");
    expect(await select('main a[href^="mailto:"]')).not.toBe("none");
  });
});

test.describe("con movimiento reducido (DESIGN.md Motion, ADR 0004)", () => {
  test.use({ viewport: desktop, reducedMotion: "reduce" });

  test("sin cuenta; las entradas solo funden y el título se queda en letras", async ({ page }) => {
    await page.goto("/");
    expect(await titleTexture(page)).toBe(false);
    await expect(page.locator("[data-count]")).toHaveText("100");

    await scrollThrough(page);
    await expect.poll(async () => (await tileOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
    const moved = await page
      .locator("main section[id] > *")
      .evaluateAll((tiles) => tiles.filter((tile) => getComputedStyle(tile).transform !== "none").length);
    expect(moved).toBe(0);
    // No tour and no live fragments: the first sector stays as written.
    const before = await liveStatuses(page);
    await page.waitForTimeout(7000);
    expect(await openSector(page)).toBe(0);
    expect(await liveStatuses(page)).toEqual(before);
  });
});

test.describe("sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false, viewport: desktop });

  // Without the script the scene never starts: the title stays in its letters, the pointer on it included.
  test("sobre el póster el puntero en el título no trae ninguna textura de código", async ({ page }) => {
    await page.goto("/");
    const box = await page.locator("main h1").boundingBox();
    if (!box) throw new Error("no title");
    await page.mouse.move(box.x + 60, box.y + box.height / 3);
    expect(await titleTexture(page)).toBe(false);
  });

  test("todo el tablero queda visible y la cifra dice su valor", async ({ page }) => {
    await page.goto("/");
    expect((await tileOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
    await expect(page.locator("[data-count]")).toHaveText("100");
    // The manifesto is in full ink: only the script sets the muted start.
    const words = await page
      .locator("[data-manifesto] [data-word]")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).opacity));
    expect(new Set(words)).toEqual(new Set(["1"]));
    // The switcher is a native exclusive accordion: every sector is in the HTML and opens one at a time.
    await expect(page.locator(TABS)).toHaveCount(4);
    expect(await openSector(page)).toBe(0);
    await page.locator(`${TABS} > summary`).nth(3).click();
    expect(await openSector(page)).toBe(3);
    await expect(page.locator(`${TABS}[open] [data-portal]`)).toBeVisible();
  });
});
