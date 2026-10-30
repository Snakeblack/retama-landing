// ADR 0009 and 0014: what the protection of main must enforce. The release commit rides in the pull request because
// nobody, admins included, may push to main (AGENTS.md, Entrega).

/**
 * Lists what `protection`, the answer of `GET repos/{owner}/{repo}/branches/main/protection`, fails to enforce:
 * a pull request nobody may bypass, the same rules for admins, no force pushes and every check of `requiredChecks`.
 * Empty when it holds.
 */
export function protectionProblems(protection, requiredChecks) {
  const problems = [];
  const reviews = protection.required_pull_request_reviews;
  if (!reviews) problems.push("main does not require a pull request");
  const bypass = reviews?.bypass_pull_request_allowances ?? {};
  const bypassers = ["users", "teams", "apps"].flatMap((kind) => bypass[kind] ?? []);
  if (bypassers.length > 0) problems.push(`${bypassers.length} actor(s) may bypass main's pull request`);
  if (!protection.enforce_admins?.enabled) problems.push("main's protection does not apply to admins");
  if (protection.allow_force_pushes?.enabled) problems.push("main allows force pushes");
  const contexts = (protection.required_status_checks?.checks ?? []).map((check) => check.context);
  const missing = requiredChecks.filter((check) => !contexts.includes(check));
  if (missing.length > 0) problems.push(`main does not require: ${missing.join(", ")}`);
  return problems;
}
