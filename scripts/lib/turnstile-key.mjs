// The Turnstile site key the contact widget uses. Its test keys always give the same answer, so the published site
// must never carry one; Workers Builds, which publishes it, refuses to build with one or with none.

/** The test key that always passes: the build's default for local, CI and E2E builds. */
export const TEST_SITE_KEY = "1x00000000000000000000AA";

// Cloudflare's test site keys: 1x… passes, 2x… blocks and 3x… forces a challenge.
const TEST_KEY = /^[123]x0{20}[A-Z]{2}$/;

/**
 * Whether an environment's site key may not be published. Only a Workers Builds build (WORKERS_CI=1) needs a real one,
 * in production and in the Previews: local and GitHub Actions builds, and E2E, keep the test key.
 * @param {Record<string, string | undefined>} env
 * @returns {boolean}
 */
export function refusedSiteKey(env) {
  if (env.WORKERS_CI !== "1") return false;
  const key = env.PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  return key === "" || TEST_KEY.test(key);
}
