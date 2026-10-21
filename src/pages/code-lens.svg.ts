import source from "../lib/retama-shape.ts?raw";
import theme from "../styles/theme.css?raw";

// DESIGN.md Motion: the texture of the code lens is the site's own generator of the scene, in tiny system
// monospace. It is decoration inside the letters, so presentation attributes only (no styles, no fonts).
// The source flows as one dense block, without indentation, so even a thin stroke shows code.
const FONT_SIZE = 8;
const LINE = 9;
const COLUMNS = 120;
const ADVANCE = 0.6 * FONT_SIZE;
const FONTS = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const ink = theme.match(/--color-on-surface:\s*([^;]+);/)?.[1] ?? "currentColor";
const flow = source.replace(/\s+/g, " ").trim();
const lines = Array.from({ length: Math.ceil(flow.length / COLUMNS) }, (_, index) =>
  flow.slice(index * COLUMNS, (index + 1) * COLUMNS).padEnd(COLUMNS),
);
const width = Math.ceil(COLUMNS * ADVANCE);
const height = lines.length * LINE;
const xmlText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<text font-family="${FONTS}" font-size="${FONT_SIZE}" fill="${ink}" xml:space="preserve">${lines
  .map((line, index) => `<tspan x="0" y="${(index + 1) * LINE}">${xmlText(line)}</tspan>`)
  .join("")}</text>
</svg>
`;

export function GET() {
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
}
