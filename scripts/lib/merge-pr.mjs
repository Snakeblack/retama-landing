// The checks of the merge procedure (scripts/merge-pr.mjs): whether a pull request may be merged, and whether a branch's
// commits are already in main. Pure, so they are tested without GitHub.

// Merge states GitHub reports that allow a merge: CLEAN (up to date, every check green), UNSTABLE (a non-required check
// is failing, accepted only when it is named) and HAS_HOOKS (clean, with pre-receive hooks).
const MERGEABLE_STATES = new Set(["CLEAN", "UNSTABLE", "HAS_HOOKS"]);

/** Whether `pr` (gh pr view --json state,isDraft,mergeable,mergeStateStatus,number) with its `checks` (gh pr checks
 * --json name,bucket) may be merged. A failing check passes only when `allowFailing` names it, and is then listed in
 * `allowed`. Every reason against is given at once. */
export function mergeVerdict(pr, checks, allowFailing = []) {
  // A closed or merged pull request has nothing else worth saying: GitHub no longer computes its merge state.
  if (pr.state !== "OPEN") return { ok: false, reasons: [`the pull request is ${pr.state}, not open`], allowed: [] };
  const reasons = [];
  if (pr.isDraft) reasons.push("the pull request is a draft");
  if (pr.mergeable === "CONFLICTING") reasons.push("it has conflicts with its base");
  else if (pr.mergeable !== "MERGEABLE") reasons.push("GitHub has not computed whether it is mergeable yet: try again");
  if (pr.mergeStateStatus === "BEHIND")
    reasons.push(`it is behind its base: run \`gh pr update-branch ${pr.number} --rebase\`, wait for CI and try again`);
  else if (pr.mergeable === "MERGEABLE" && !MERGEABLE_STATES.has(pr.mergeStateStatus))
    reasons.push(`its merge state is ${pr.mergeStateStatus}`);

  if (checks.length === 0) reasons.push("it has no checks");
  const allowed = [];
  for (const { name, bucket } of checks) {
    if (bucket === "pass" || bucket === "skipping") continue;
    if (bucket === "pending") reasons.push(`check "${name}" is still running`);
    else if (allowFailing.includes(name)) allowed.push(name);
    else reasons.push(`check "${name}" is ${bucket === "cancel" ? "cancelled" : "failing"}`);
  }
  return { ok: reasons.length === 0, reasons, allowed };
}

/** Whether every commit of a branch is in main, from `git cherry main <branch>`: rebase merges rewrite the hashes, so
 * commits are matched by their patch ("-" in main, "+" missing). */
export function inMain(cherry) {
  return cherry
    .split("\n")
    .filter(Boolean)
    .every((line) => line.startsWith("-"));
}
