// Architecture fitness checks behind the ADRs' `- Check:` lines.
//   node scripts/fitness.mjs on-demand-routes        ADR 0002, ADR 0011
//   node scripts/fitness.mjs no-persistent-bindings  ADR 0003 (run after pnpm build)
//   node scripts/fitness.mjs branch-protection       ADR 0009 (needs gh auth)
//   node scripts/fitness.mjs js-budget               ADR 0001 (run after pnpm build)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { initialScripts } from "./lib/js-budget.mjs";

// ADR 0002 and ADR 0011: the routes rendered on demand, the contact and the client error reports. Adding one needs an ADR.
const ON_DEMAND_ALLOWED = ["src/pages/api/contact.ts", "src/pages/api/report.ts"];
const PERSISTENT_BINDINGS = [
  "kv_namespaces",
  "d1_databases",
  "r2_buckets",
  "durable_objects",
  "vectorize",
  "hyperdrive",
  "queues",
  "analytics_engine_datasets",
  "secrets_store_secrets",
];
const REQUIRED_CHECKS = ["quality", "e2e", "lighthouse"];
// ADR 0001: JavaScript a page loads at start, gzipped. Deferred chunks (the 3D scene) are not counted.
const JS_BUDGET = 60 * 1024;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function pageFiles(dir) {
  return readdirSync(dir, { recursive: true })
    .map((file) => join(dir, file))
    .filter((file) => /\.(astro|ts|js|mjs)$/.test(file));
}

function onDemandRoutes() {
  const config = readFileSync("astro.config.mjs", "utf8");
  if (/output:\s*["']server["']/.test(config)) fail("astro.config.mjs sets output: 'server' (ADR 0002)");
  const onDemand = pageFiles("src/pages").filter((file) =>
    /export\s+const\s+prerender\s*=\s*false/.test(readFileSync(file, "utf8")),
  );
  const extra = onDemand.filter((file) => !ON_DEMAND_ALLOWED.includes(file));
  if (extra.length > 0) fail(`on-demand routes outside the ADR 0002/0011 allowlist: ${extra.join(", ")}`);
  console.log(`on-demand routes: ${onDemand.length === 0 ? "none" : onDemand.join(", ")}`);
}

function stripJsonc(text) {
  return text.replace(/^\s*\/\/.*$/gm, "");
}

function noPersistentBindings() {
  const configs = ["wrangler.jsonc", "dist/client/wrangler.json", "dist/server/wrangler.json"].filter(existsSync);
  if (!configs.includes("dist/client/wrangler.json") && !configs.includes("dist/server/wrangler.json")) {
    fail("no generated wrangler.json in dist/: run pnpm build first");
  }
  for (const path of configs) {
    const config = JSON.parse(stripJsonc(readFileSync(path, "utf8")));
    for (const key of PERSISTENT_BINDINGS) {
      const value = config[key];
      const bindings = Array.isArray(value) ? value : (value?.bindings ?? value?.producers ?? []);
      if (bindings.length > 0) fail(`${path} declares ${key} (ADR 0003 forbids persistent storage)`);
    }
  }
  console.log(`no persistent bindings in ${configs.join(", ")}`);
}

function branchProtection() {
  const remote = execFileSync("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], {
    encoding: "utf8",
  }).trim();
  let contexts;
  try {
    contexts = JSON.parse(
      execFileSync(
        "gh",
        ["api", `repos/${remote}/branches/main/protection/required_status_checks`, "--jq", "[.checks[].context]"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ),
    );
  } catch (error) {
    fail(`main has no required status checks on ${remote} (ADR 0009): ${String(error.stderr).trim()}`);
  }
  const missing = REQUIRED_CHECKS.filter((check) => !contexts.includes(check));
  if (missing.length > 0) fail(`main does not require: ${missing.join(", ")} (ADR 0009)`);
  console.log(`main requires ${contexts.join(", ")}`);
}

function jsBudget() {
  const root = "dist/client";
  if (!existsSync(root)) fail("no dist/client: run pnpm build first");
  const read = (path) => readFileSync(join(root, path), "utf8");
  const pages = readdirSync(root, { recursive: true }).filter((file) => String(file).endsWith(".html"));
  for (const page of pages) {
    const scripts = initialScripts(read(String(page)), read);
    const size = scripts.reduce(
      (total, script) => total + gzipSync(script.startsWith("<inline>") ? script.slice(8) : read(script)).length,
      0,
    );
    const line = `${page}: ${(size / 1024).toFixed(1)} KB of ${JS_BUDGET / 1024} KB gzip (${scripts.length} scripts)`;
    if (size > JS_BUDGET) fail(`${line}: over the ADR 0001 budget`);
    console.log(line);
  }
}

const checks = {
  "on-demand-routes": onDemandRoutes,
  "no-persistent-bindings": noPersistentBindings,
  "branch-protection": branchProtection,
  "js-budget": jsBudget,
};
const check = checks[process.argv[2] ?? ""];
if (!check) fail(`usage: node scripts/fitness.mjs <${Object.keys(checks).join("|")}>`);
check();
