import { defineConfig, devices } from "@playwright/test";

const port = 4398;

// E2E runs against the production build served by workerd, so _headers and the
// CSP apply as in Cloudflare (ADR 0006: the dev server does not enforce them).
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm serve:dist --port ${port}`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
