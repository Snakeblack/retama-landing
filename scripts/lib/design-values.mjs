// ADR 0005: components use DESIGN.md tokens only. This finds the loose colours and sizes that slip past
// the generated theme: Tailwind's default scale and palette, literal arbitrary values and raw CSS values.

const NAMESPACES = ["color", "font-weight", "font", "text", "leading", "tracking", "radius", "spacing"];

/** Reads the token names of a generated `@theme` block, grouped by namespace. */
export function parseTokens(themeCss) {
  const tokens = Object.fromEntries(NAMESPACES.map((namespace) => [namespace, new Set()]));
  // font-weight is listed before font, so `--font-weight-x` never reads as a family called `weight-x`.
  const pattern = new RegExp(`--(${NAMESPACES.join("|")})-([\\w-]+)\\s*:`, "g");
  for (const [, namespace, name] of themeCss.matchAll(pattern)) tokens[namespace].add(name);
  return tokens;
}

const PALETTE =
  /^(?:(?:slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|black|white)(?:\/\d+)?$/;
const NUMBER = /^\d*\.?\d+$/;
const TYPE_SCALE = /^(?:xs|sm|base|lg|\d?xl)$/;
const CONTAINER_SCALE = /^(?:\d?xs|sm|md|lg|\d?xl|prose)$/;
const FONT_DEFAULTS = /^(?:sans|serif|mono|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;
const COLOR_PREFIXES = [
  "bg",
  "border",
  "border-x",
  "border-y",
  "border-t",
  "border-r",
  "border-b",
  "border-l",
  "border-s",
  "border-e",
  "outline",
  "ring",
  "ring-offset",
  "fill",
  "stroke",
  "decoration",
  "accent",
  "caret",
  "divide",
  "placeholder",
  "from",
  "via",
  "to",
];
const SPACING_PREFIXES = [
  "p",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "ps",
  "pe",
  "m",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "ms",
  "me",
  "gap",
  "gap-x",
  "gap-y",
  "space-x",
  "space-y",
  "inset",
  "inset-x",
  "inset-y",
  "top",
  "right",
  "bottom",
  "left",
  "size",
  "basis",
  "translate-x",
  "translate-y",
  "scroll-m",
  "scroll-p",
  "indent",
];
// Tailwind resolves these against its container scale before the spacing tokens.
const WIDTH_PREFIXES = ["w", "h", "min-w", "max-w", "min-h", "max-h"];

/** The utility itself: variants (`sm:`, `hover:`), the important mark and the negative sign removed. */
function utilityOf(className) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < className.length; i++) {
    const char = className[i];
    if (char === "[" || char === "(") depth++;
    else if (char === "]" || char === ")") depth--;
    else if (char === ":" && depth === 0) start = i + 1;
  }
  return className.slice(start).replace(/^!|!$/g, "").replace(/^-/, "");
}

/** Splits `max-w-content` into its prefix and value, taking the longest prefix that matches. */
function split(utility, prefixes) {
  const prefix = prefixes
    .filter((candidate) => utility.startsWith(`${candidate}-`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? utility.slice(prefix.length + 1) : undefined;
}

function classProblem(utility, tokens) {
  const arbitrary = utility.match(/\[(.*)\]/);
  if (arbitrary) {
    const inner = (arbitrary[1] ?? "").replace(/^[a-z-]+:(?=var\(|--)/, "");
    return inner.startsWith("var(--") || inner.startsWith("--") ? undefined : "arbitrary literal value";
  }
  if (utility.includes("(")) return undefined;

  const text = split(utility, ["text"]);
  if (text !== undefined && !tokens.color.has(text) && !tokens.text.has(text)) {
    if (PALETTE.test(text)) return "default Tailwind colour";
    if (TYPE_SCALE.test(text)) return "default Tailwind type scale";
  }
  const color = split(utility, COLOR_PREFIXES);
  if (color !== undefined && !tokens.color.has(color)) {
    if (PALETTE.test(color)) return "default Tailwind colour";
    if (NUMBER.test(color) && color !== "0") return "default Tailwind width";
  }
  const leading = split(utility, ["leading"]);
  if (leading !== undefined && !tokens.leading.has(leading)) return "line height outside the tokens";
  const tracking = split(utility, ["tracking"]);
  if (tracking !== undefined && !tokens.tracking.has(tracking)) return "letter spacing outside the tokens";
  const radius = utility.match(/^rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?-(.+)$/)?.[1];
  if (radius !== undefined && !tokens.radius.has(radius) && radius !== "none" && radius !== "full") {
    return "radius outside the tokens";
  }
  const font = split(utility, ["font"]);
  if (font !== undefined && !tokens.font.has(font) && FONT_DEFAULTS.test(font)) {
    return "default Tailwind font or weight";
  }
  const width = split(utility, WIDTH_PREFIXES);
  if (width !== undefined && CONTAINER_SCALE.test(width)) return "default Tailwind container size";
  const space = split(utility, [...SPACING_PREFIXES, ...WIDTH_PREFIXES]);
  if (space !== undefined && !tokens.spacing.has(space) && ((NUMBER.test(space) && space !== "0") || space === "px")) {
    return "default Tailwind spacing";
  }
  return undefined;
}

/** Checks a class list; each finding carries the class and its offset in the string. */
export function checkClasses(classList, tokens) {
  const findings = [];
  for (const match of classList.matchAll(/\S+/g)) {
    const problem = classProblem(utilityOf(match[0]), tokens);
    if (problem) findings.push({ index: match.index, value: match[0], message: `${problem}; use a DESIGN.md token` });
  }
  return findings;
}

const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\((?:[^()]|\([^()]*\))*\)/g;
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const LENGTH = /(?<![\w.#-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/g;
const BARE_NUMBER = /(?<![\w.#-])(?:\d+\.?\d*|\.\d+)(?![\w%.(])/g;
const TYPOGRAPHIC = new Set(["font-size", "font-weight", "line-height", "letter-spacing"]);
const COLOR_PROPERTY =
  /^(?:color|background-color|border(?:-(?:top|right|bottom|left|inline|block)(?:-start|-end)?)?-color|outline-color|fill|stroke|caret-color|accent-color|text-decoration-color|column-rule-color)$/;
const COLOR_KEYWORDS = new Set(["currentcolor", "transparent", "inherit", "initial", "unset", "revert", "none"]);

const blank = (text) => text.replace(/[^\n]/g, " ");
const lineAt = (text, index) => text.slice(0, index).split("\n").length;

/** Checks a stylesheet for raw colours and sizes; each finding carries its line. */
export function checkCss(css, tokens) {
  const findings = [];
  const add = (index, value, problem) =>
    findings.push({ index, line: lineAt(css, index), value, message: `${problem}; use a DESIGN.md token` });

  let text = css.replace(/\/\*[\s\S]*?\*\//g, blank);
  for (const match of text.matchAll(/@apply\s+([^;}]+)/g)) {
    if (!tokens) continue;
    const offset = match.index + match[0].indexOf(match[1] ?? "");
    for (const finding of checkClasses(match[1] ?? "", tokens)) {
      const index = offset + finding.index;
      findings.push({ index, line: lineAt(css, index), value: finding.value, message: finding.message });
    }
  }
  text = text.replace(/@[a-z-]+[^{;]*/gi, blank);

  for (const match of text.matchAll(/(?<=[{;]\s*)([-\w]+)\s*:\s*([^;{}]+)/g)) {
    const [declaration, property = "", rawValue = ""] = match;
    const start = match.index + declaration.length - rawValue.length;
    const value = rawValue.replace(/var\(--[\w-]+\)/g, blank);
    for (const found of value.matchAll(COLOR_FUNCTION)) add(start + found.index, found[0], "raw colour");
    const outsideFunctions = value.replace(COLOR_FUNCTION, blank);
    for (const found of outsideFunctions.matchAll(HEX)) add(start + found.index, found[0], "raw colour");
    for (const found of outsideFunctions.matchAll(LENGTH)) {
      if (Number.parseFloat(found[0]) !== 0) add(start + found.index, found[0], "raw size");
    }
    if (TYPOGRAPHIC.has(property)) {
      for (const found of outsideFunctions.matchAll(BARE_NUMBER)) {
        if (Number.parseFloat(found[0]) !== 0) add(start + found.index, found[0], "raw type value");
      }
    }
    if (COLOR_PROPERTY.test(property)) {
      for (const found of outsideFunctions.replace(HEX, blank).matchAll(/[a-zA-Z][\w-]*/g)) {
        if (!COLOR_KEYWORDS.has(found[0].toLowerCase())) add(start + found.index, found[0], "named colour");
      }
    }
  }
  return findings.sort((a, b) => a.index - b.index).map(({ line, value, message }) => ({ line, value, message }));
}

/** Checks one source file: a stylesheet, or an Astro component's class attributes and `<style>` blocks. */
export function checkSource(path, source, tokens) {
  if (path.endsWith(".css")) return checkCss(source, tokens);
  const findings = [];
  const frontmatter = source.match(/^---\n[\s\S]*?\n---\n/)?.[0].length ?? 0;
  const template = blank(source.slice(0, frontmatter)) + source.slice(frontmatter);

  for (const match of template.matchAll(/\bclass(?::list)?\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const classes = match[1] ?? match[2] ?? "";
    const offset = match.index + match[0].indexOf(classes);
    for (const finding of checkClasses(classes, tokens)) {
      const index = offset + finding.index;
      findings.push({ index, line: lineAt(source, index), value: finding.value, message: finding.message });
    }
  }
  for (const match of template.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    const offset = match.index + match[0].indexOf(">") + 1;
    const before = lineAt(source, offset) - 1;
    for (const finding of checkCss(match[1] ?? "", tokens)) {
      findings.push({ index: offset, line: before + finding.line, value: finding.value, message: finding.message });
    }
  }
  return findings
    .sort((a, b) => a.line - b.line || a.index - b.index)
    .map(({ line, value, message }) => ({ line, value, message }));
}
