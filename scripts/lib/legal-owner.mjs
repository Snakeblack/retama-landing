// The owner of the site the legal notice names (LSSI art. 10). Their data comes from the build environment, so it stays
// out of the public repository; Workers Builds, which publishes the site, refuses to build without it.

/** The variables the legal notice cannot go without. The NIF and the address are optional until they exist. */
export const REQUIRED_OWNER = ["PUBLIC_LEGAL_NAME", "PUBLIC_LEGAL_TOWN"];

/**
 * The required owner variables missing from an environment. Only a Workers Builds build (WORKERS_CI=1) needs them:
 * local and GitHub Actions builds go without, and E2E sets test ones.
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function missingOwner(env) {
  if (env.WORKERS_CI !== "1") return [];
  return REQUIRED_OWNER.filter((name) => !env[name]?.trim());
}
