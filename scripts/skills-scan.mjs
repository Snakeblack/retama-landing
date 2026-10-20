// ADR 0010 fitness: vendored skills match their manifest and carry no
// unreviewed risk pattern.
//   node scripts/skills-scan.mjs            check (CI)
//   node scripts/skills-scan.mjs --findings print every finding, reviewed or not
//   node scripts/skills-scan.mjs --rehash   record the current hashes, only after a reviewed update
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  diffFiles,
  listFiles,
  MANIFEST,
  readManifest,
  SKILLS_DIR,
  scanText,
  sha256,
  unreviewed,
} from "./lib/skills.mjs";

const manifest = readManifest();

if (process.argv.includes("--rehash")) {
  for (const [name, entry] of Object.entries(manifest.skills)) {
    const dir = join(SKILLS_DIR, name);
    entry.files = Object.fromEntries(listFiles(dir).map((file) => [file, sha256(readFileSync(join(dir, file)))]));
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`rehashed ${Object.keys(manifest.skills).length} skills into ${MANIFEST}`);
  process.exit(0);
}
const folders = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const problems = [];
const findings = [];

for (const name of folders) {
  const dir = join(SKILLS_DIR, name);
  const actual = Object.fromEntries(listFiles(dir).map((file) => [file, readFileSync(join(dir, file))]));
  for (const [file, content] of Object.entries(actual))
    findings.push(...scanText(`${name}/${file}`, content.toString("utf8")));
  const entry = manifest.skills[name];
  if (!entry) problems.push(`${name}: folder not in the manifest`);
  else for (const drift of diffFiles(entry.files, actual)) problems.push(`${name}: ${drift}`);
}
for (const name of Object.keys(manifest.skills)) {
  if (!folders.includes(name)) problems.push(`${name}: in the manifest but not on disk`);
}

// ADR 0010: one source per topic.
const sources = new Map();
for (const [name, entry] of Object.entries(manifest.skills)) {
  const known = sources.get(entry.topic);
  if (known && known !== entry.source) problems.push(`${name}: topic ${entry.topic} already owned by ${known}`);
  sources.set(entry.topic, entry.source);
}

if (process.argv.includes("--findings")) {
  for (const f of findings) console.log(`${f.path}:${f.line} ${f.rule}`);
  process.exit(0);
}

for (const f of unreviewed(findings, manifest.reviewed ?? []))
  problems.push(`${f.path}:${f.line} unreviewed ${f.rule}`);

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  console.error(`\n${problems.length} problem(s). Review, then update ${SKILLS_DIR}/manifest.json.`);
  process.exit(1);
}
console.log(`skills: ${folders.length} folders match the manifest, no unreviewed findings`);
