// The pnpm that builds the published site must be the one package.json pins (packageManager). With pmOnFail: ignore
// (pnpm-workspace.yaml) pnpm no longer switches itself to that version and the lockfile no longer records its hash, so
// Workers Builds, which publishes the site, refuses to build with any other.

/**
 * The version of the pnpm running the build when it is not the pinned one, "unknown" when no pnpm launched the build,
 * or null. Only a Workers Builds build (WORKERS_CI=1) is checked: local builds go with any pnpm, and GitHub Actions
 * installs the pinned one with pnpm/action-setup. pnpm names itself in npm_config_user_agent ("pnpm/12.14.0 npm/? …").
 * @param {Record<string, string | undefined>} env
 * @param {string} packageManager the packageManager field of package.json, "pnpm@<version>"
 * @returns {string | null}
 */
export function unpinnedPnpm(env, packageManager) {
  if (env.WORKERS_CI !== "1") return null;
  const running = /^pnpm\/(\S+)/.exec(env.npm_config_user_agent ?? "")?.[1];
  if (!running) return "unknown";
  return `pnpm@${running}` === packageManager ? null : running;
}
