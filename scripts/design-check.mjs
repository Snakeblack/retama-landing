// ADR 0005: DESIGN.md is the single source of the design tokens.
//   node scripts/design-check.mjs          lint DESIGN.md and check the theme is in sync
//   node scripts/design-check.mjs --write  regenerate src/styles/theme.css
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CLI = "node_modules/.bin/design.md";
const THEME = "src/styles/theme.css";
const HEADER = "/* Generated from DESIGN.md by `pnpm design:theme`. Do not edit. */\n";

function run(args) {
  try {
    return execFileSync(CLI, args, { encoding: "utf8" });
  } catch (error) {
    // `lint` exits non-zero on errors but still prints its JSON report.
    if (error.stdout) return error.stdout;
    throw error;
  }
}

// Astro's font API self-hosts each DESIGN.md family under a hashed name and exposes it, with its
// metric-matched fallback, as `--font-<family slug>` (astro.config.mjs). The theme points at that stack.
const selfHosted = (_, token, family) =>
  `--font-${token}: var(--font-${family.toLowerCase().replace(/\s+/g, "-")}, "${family}", sans-serif);`;
const exported = run(["export", "DESIGN.md", "--format", "css-tailwind"]).replace(
  /--font-([\w-]+): "([^"]+)";/g,
  selfHosted,
);

// One `type-<name>` utility per DESIGN.md typography level, so a component sets a level with one class.
const TYPE_PROPERTIES = [
  ["font", "font-family"],
  ["text", "font-size"],
  ["leading", "line-height"],
  ["tracking", "letter-spacing"],
  ["font-weight", "font-weight"],
];
const levels = [...exported.matchAll(/--text-([\w-]+):/g)].map(([, name]) => name);
const utilities = levels.map((name) => {
  const declarations = TYPE_PROPERTIES.filter(([namespace]) => exported.includes(`--${namespace}-${name}:`)).map(
    ([namespace, property]) => `  ${property}: var(--${namespace}-${name});`,
  );
  return `@utility type-${name} {\n${declarations.join("\n")}\n}\n`;
});
const theme = HEADER + exported + utilities.join("");

if (process.argv.includes("--write")) {
  writeFileSync(THEME, theme);
  console.log(`wrote ${THEME}`);
  process.exit(0);
}

let failed = false;
const report = JSON.parse(run(["lint", "DESIGN.md", "--format", "json"]));
// Contrast below WCAG AA is only a warning in the CLI: treat warnings as failures.
for (const finding of report.findings.filter((f) => f.severity !== "info")) {
  console.error(`DESIGN.md ${finding.severity}: ${finding.path ?? ""} ${finding.message}`);
  failed = true;
}

let current = "";
try {
  current = readFileSync(THEME, "utf8");
} catch {}
if (current !== theme) {
  console.error(`${THEME} is out of sync with DESIGN.md: run pnpm design:theme`);
  failed = true;
}

if (failed) process.exit(1);
console.log("DESIGN.md: lint clean, theme in sync");
