// ESLint only covers .astro files; Biome owns JS, TS, JSON and CSS (its .astro
// support is still experimental, see docs/architecture/technical-baseline.md).
import astro from "eslint-plugin-astro";

export default [
  { ignores: ["**/*.{js,mjs,cjs,ts,mts,cts}", "dist/**", ".astro/**", ".claude/skills/**"] },
  ...astro.configs.recommended,
];
