// Vendored agent skills (ADR 0010): file hashes against the manifest and a risk
// scan. Pure helpers; scripts/skills-scan.mjs and the unit tests drive them.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export const SKILLS_DIR = ".claude/skills";
export const MANIFEST = `${SKILLS_DIR}/manifest.json`;

/** @param {Buffer | string} content */
export function sha256(content) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`;
}

/** Files of one skill folder, relative to it, sorted. @param {string} dir */
export function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
}

/** Symlinks of one skill folder: never hashed or scanned, so never allowed. @param {string} dir */
export function listLinks(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isSymbolicLink())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
}

/**
 * Compares a skill folder with its manifest entry.
 * @param {Record<string, string>} expected path -> hash from the manifest
 * @param {Record<string, Buffer | string>} actual path -> content on disk
 * @returns {string[]} one message per drift
 */
export function diffFiles(expected, actual) {
  const problems = [];
  for (const [path, hash] of Object.entries(expected)) {
    if (!(path in actual)) problems.push(`missing ${path}`);
    else if (sha256(actual[path] ?? "") !== hash) problems.push(`changed ${path}`);
  }
  for (const path of Object.keys(actual)) {
    if (!(path in expected)) problems.push(`unlisted ${path}`);
  }
  return problems;
}

// Each rule flags text a reviewer must look at before it can enter the repo.
const shellPipe = new RegExp(["(curl|wget)", "[^\\n|]*", "\\|", "\\s*", "(sudo\\s+)?(ba|z)?sh\\b"].join(""), "i");
export const RULES = [
  { id: "invisible-char", pattern: /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u{E0000}-\u{E007F}]/u },
  { id: "pipe-to-shell", pattern: shellPipe },
  {
    id: "prompt-injection",
    pattern: /ignore (all |any )?(the )?(previous|prior|above) instructions|disregard (all |any )?(previous|prior) /i,
  },
  {
    id: "remote-instructions",
    pattern:
      /(fetch|download|load|retrieve|pull)\b[^\n]{0,60}\b(latest|current|fresh)\b[^\n]{0,40}\b(rules|instructions|guidelines|prompt)/i,
  },
  // Cloning a repository or downloading a file at use time pulls unpinned content.
  { id: "remote-clone", pattern: /\bgit\b[^\n]*\bclone\b/ },
  { id: "remote-download", pattern: /\b(curl|wget)\b[^\n]*https?:\/\//i },
  { id: "hosted-prompt", pattern: /\bhosted\b[^\n]{0,30}\bprompt\b/i },
  { id: "on-demand-fetch", pattern: /\bfetch\w*\b[^\n]{0,60}\bon demand\b/i },
  { id: "raw-remote-file", pattern: /raw\.githubusercontent\.com|gist\.githubusercontent\.com|pastebin\.com/i },
  // Any dotfile in the user's home: global agent config, credentials, caches.
  { id: "home-dotfile", pattern: /(~|\$HOME|\$\{HOME\})\/\.[\w.-]+/ },
  { id: "hook-definition", pattern: /"hooks"\s*:\s*\{|PreToolUse|PostToolUse|UserPromptSubmit/ },
];

/**
 * @param {string} path a path inside the skills folder
 * @param {string} text the file content
 * @returns {{path: string, rule: string, line: number}[]}
 */
export function scanText(path, text) {
  const findings = [];
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) findings.push({ path, rule: rule.id, line: index + 1 });
    }
  });
  return findings;
}

/**
 * Findings a reviewer has not accepted in the manifest's `reviewed` list.
 * @param {{path: string, rule: string}[]} findings
 * @param {{path: string, rule: string, reason: string}[]} reviewed
 */
export function unreviewed(findings, reviewed) {
  return findings.filter((f) => !reviewed.some((r) => r.path === f.path && r.rule === f.rule && r.reason?.trim()));
}

export function readManifest() {
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}
