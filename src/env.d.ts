// The runtime module the Cloudflare adapter exposes. Only what this site binds is typed: the contact
// function's secrets and its rate limiter (wrangler.jsonc), instead of the generated runtime types.
declare module "cloudflare:workers" {
  export const env: import("./server/contact").ContactEnv;
}
