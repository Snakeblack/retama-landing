// Merges a pull request by the project's procedure, one at a time:
//   pnpm pr:merge <number>                                      check, merge with rebase, verify, clean up
//   pnpm pr:merge <number> --dry-run                            only check
//   pnpm pr:merge <number> --allow-failing "<check name>"       accept that failing check, named, and say so
// 1. It refuses unless the pull request is open, mergeable, up to date with its base and every check on its head
//    commit is green (scripts/lib/merge-pr.mjs). 2. It merges with rebase, tied to that commit. 3. It confirms GitHub
//    says MERGED. 4. Only then it deletes the remote branch and the local one, once git cherry finds all its commits in
//    the base. Each step runs only when the one before succeeded.
import { execFileSync } from "node:child_process";
import { inMain, mergeVerdict } from "./lib/merge-pr.mjs";

const run = (command, args) => execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const gh = (...args) => run("gh", args);
const git = (...args) => run("git", args);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const number = args.find((arg) => /^\d+$/.test(arg));
if (!number) fail('usage: pnpm pr:merge <number> [--dry-run] [--allow-failing "<check name>"]...');
const dryRun = args.includes("--dry-run");
const allowFailing = args.flatMap((arg, index) =>
  arg === "--allow-failing" && args[index + 1] ? [args[index + 1]] : [],
);

// 1. Check.
const fields = "number,state,isDraft,mergeable,mergeStateStatus,headRefOid,headRefName,baseRefName";
const pr = JSON.parse(gh("pr", "view", number, "--json", fields));
let checks;
try {
  checks = JSON.parse(gh("pr", "checks", number, "--json", "name,bucket"));
} catch (error) {
  // gh exits non-zero while a check is pending or failing, and still prints them.
  if (!error.stdout) throw error;
  checks = JSON.parse(error.stdout);
}
const verdict = mergeVerdict(pr, checks, allowFailing);
console.log(`#${number} ${pr.headRefName} → ${pr.baseRefName} at ${pr.headRefOid.slice(0, 7)}: ${pr.mergeStateStatus}`);
for (const { name, bucket } of checks) console.log(`  ${bucket.padEnd(8)} ${name}`);
if (!verdict.ok) fail(`not merging #${number}:\n  - ${verdict.reasons.join("\n  - ")}`);
for (const name of verdict.allowed) console.log(`! accepting failing check "${name}" (--allow-failing)`);
if (dryRun) {
  console.log(`✓ #${number} may be merged (dry run, nothing changed)`);
  process.exit(0);
}

// 2. Merge, tied to the commit just checked: GitHub refuses if the branch moved since.
gh("pr", "merge", number, "--rebase", "--match-head-commit", pr.headRefOid);

// 3. Verify.
const after = JSON.parse(gh("pr", "view", number, "--json", "state,mergedAt"));
if (after.state !== "MERGED") fail(`#${number} is ${after.state} after the merge; nothing was cleaned up`);
console.log(`✓ #${number} merged at ${after.mergedAt}`);

// 4. Clean up, now that the merge is confirmed.
try {
  git("push", "origin", "--delete", pr.headRefName);
  console.log(`✓ deleted origin/${pr.headRefName}`);
} catch {
  console.log(`  origin/${pr.headRefName} was already gone`);
}
git("fetch", "--quiet", "--prune", "origin");
const local = (() => {
  try {
    git("rev-parse", "--verify", "--quiet", `refs/heads/${pr.headRefName}`);
    return true;
  } catch {
    return false;
  }
})();
if (local) {
  if (git("branch", "--show-current").trim() === pr.headRefName) git("switch", "--quiet", pr.baseRefName);
  if (git("branch", "--show-current").trim() === pr.baseRefName) git("pull", "--quiet", "--ff-only");
  if (inMain(git("cherry", `origin/${pr.baseRefName}`, pr.headRefName))) {
    git("branch", "-D", pr.headRefName);
    console.log(`✓ deleted local ${pr.headRefName}: all its commits are in ${pr.baseRefName}`);
  } else console.log(`! kept local ${pr.headRefName}: it has commits that are not in ${pr.baseRefName}`);
}
