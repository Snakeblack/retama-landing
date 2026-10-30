// The agent setup of ADR 0013. The third-party skills come from the Retama playbook, so the versioned settings only
// enable its two plugins, and .claude/skills only holds the project's own skills: plain Markdown, without hooks,
// tool grants, load-time commands, symlinks or hidden characters. This repository is public: anything else there would
// load in every session of a clone.
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const PLAYBOOK_PLUGINS = ["retama-motion@retama", "retama@retama"];

// Zero-width characters, the bidirectional marks, embeddings, overrides and isolates (Trojan Source), and the Unicode
// tag block, which hide text from a reviewer.
const INVISIBLE = /[\u061C\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF\u{E0000}-\u{E007F}]/u;
// Frontmatter keys that give a skill authority: hooks, and tools it may use without asking. Plain, quoted or inside a
// flow mapping.
const AUTHORITY = /(^|[{,\s])["']?(hooks|allowed-tools)["']?\s*:/m;
// A bang before a backticked command, or a fenced block opened with a bang (```!), runs that command when the skill
// loads.
const LOAD_COMMAND = /!`|^[ \t]*`{3,}!/m;

/**
 * The problems of the tracked files that Claude Code loads from a clone: under .claude/ only settings.json and the
 * skills, and no .mcp.json at the root (commands, agents, hooks and MCP servers would load in every session).
 * @param {string[]} files tracked paths, relative to the repository root
 * @returns {string[]}
 */
export function agentFilesProblems(files) {
  const problems = [];
  for (const file of files) {
    if (file === ".mcp.json") problems.push(`${file}: MCP servers are not allowed`);
    else if (file.startsWith(".claude/") && file !== ".claude/settings.json" && !file.startsWith(".claude/skills/")) {
      problems.push(`${file}: only settings.json and skills/ are allowed under .claude`);
    }
  }
  return problems;
}

/**
 * The problems of the versioned .claude/settings.json: it holds only enabledPlugins, with exactly the playbook's two
 * plugins enabled.
 * @param {Record<string, unknown>} settings
 * @returns {string[]}
 */
export function settingsProblems(settings) {
  const problems = [];
  for (const key of Object.keys(settings)) {
    if (key !== "enabledPlugins") problems.push(`settings: unexpected key ${key}`);
  }
  const enabled = /** @type {Record<string, unknown>} */ (settings.enabledPlugins ?? {});
  const names = Object.keys(enabled).sort();
  if (names.join() !== PLAYBOOK_PLUGINS.join()) {
    problems.push(`settings: enabledPlugins must be ${PLAYBOOK_PLUGINS.join(", ")}, not ${names.join(", ") || "none"}`);
  }
  for (const name of names) if (enabled[name] !== true) problems.push(`settings: ${name} is not enabled`);
  return problems;
}

/**
 * The problems of .claude/skills: every entry is a folder with a SKILL.md, and every file is non-executable Markdown,
 * not a symlink, with no hooks or allowed-tools in its frontmatter, no load-time command and no invisible characters.
 * @param {string} dir
 * @returns {string[]}
 */
export function skillsProblems(dir) {
  const problems = [];
  for (const name of readdirSync(dir)) {
    const stat = lstatSync(join(dir, name));
    if (!stat.isDirectory() || stat.isSymbolicLink()) problems.push(`${name}: not a skill folder`);
    else if (!existsSync(join(dir, name, "SKILL.md"))) problems.push(`${name}: has no SKILL.md`);
  }
  const walk = (rel) => {
    for (const name of readdirSync(join(dir, rel))) {
      const path = rel ? `${rel}/${name}` : name;
      const stat = lstatSync(join(dir, path));
      if (stat.isSymbolicLink()) problems.push(`${path}: symlink`);
      else if (stat.isDirectory()) walk(path);
      else if (!path.endsWith(".md")) problems.push(`${path}: not Markdown`);
      else {
        if (stat.mode & 0o111) problems.push(`${path}: executable`);
        const text = readFileSync(join(dir, path), "utf8");
        if (INVISIBLE.test(text)) problems.push(`${path}: invisible characters`);
        if (LOAD_COMMAND.test(text)) problems.push(`${path}: load-time command`);
        const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
        const key = AUTHORITY.exec(frontmatter)?.[2];
        if (key) problems.push(`${path}: ${key} in the frontmatter`);
      }
    }
  };
  walk("");
  return problems;
}
