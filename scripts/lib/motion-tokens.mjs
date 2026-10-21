// ADR 0005: the motion tokens live in the table of DESIGN.md "Motion and 3D" and reach the code through the
// generated theme. `static` keeps them in the CSS even when no utility uses them: the motion script reads them.

const SECTION = /^## Motion and 3D\n([\s\S]*?)(?=^## )/m;
const ROW = /^\| ((?:ease|t|stagger)-[\w-]+) \| ([^|]+?) \|/;

/** The `@theme static` block of the motion tokens, from the first table of the DESIGN.md motion section. */
export function motionTheme(markdown) {
  const section = markdown.match(SECTION)?.[1];
  if (!section) throw new Error("DESIGN.md has no Motion and 3D section");
  const table = section.slice(section.indexOf("\n|")).split(/\n(?!\|)/)[0] ?? "";
  const rows = table
    .split("\n")
    .map((line) => line.match(ROW))
    .filter(Boolean);
  if (rows.length === 0) throw new Error("DESIGN.md Motion and 3D has no token table");
  return `@theme static {\n${rows.map(([, name, value]) => `  --${name}: ${value};`).join("\n")}\n}\n`;
}
