// Facts of the board that are the same in every language (DESIGN.md, Imagery and Components).
// The contact channels live here and only here; the owner's personal ones (WhatsApp) come from the build environment.

/** The contact address beside the form; its visible text is the address itself. Cloudflare Email Routing forwards it
 * to the owner's inbox. */
export const contactEmail = "hola@retama.dev";

/** The Cal.com page where a call is booked (the owner's account, event "Llamada"); it shows only while PUBLIC_BOOKING
 * is on (astro.config.mjs). Contact.astro admits its origin, and only it, as a frame. The Turnstile site key is not
 * here: it comes from the build environment (PUBLIC_TURNSTILE_SITE_KEY, astro.config.mjs). */
export const bookingUrl = "https://cal.com/retama/llamada";

/** The two partners of the team chapter (owner, 2026-10-26), the one the client talks to first: the name as they sign
 * it, the initials that hold the portrait's place until its photograph is in src/assets/team/<key>.jpg, and a public
 * profile only where one exists. */
export const partners = [
  { key: "paul", name: "Paul Macorny Retamozo García", initials: "PR", role: "team.paulRole", line: "team.paulLine" },
  {
    key: "michael",
    name: "Manuel Michael Retamozo García",
    initials: "MR",
    role: "team.michaelRole",
    line: "team.michaelLine",
    linkedin: "https://www.linkedin.com/in/mmretamozo/",
  },
] as const;

/** The name the blog's articles are signed with (owner, 2026-10-26): Michael's, as the blog gives it. */
export const blogAuthor = "Manuel M.";

/** Where Retama works (owner, 2026-10-26): Spain, Portugal and the Spanish-speaking countries of the Americas, Puerto
 * Rico included, as ISO 3166-1 codes. The JSON-LD names each one in the page's language (src/lib/seo.ts). */
export const areaServed = [
  "ES",
  "PT",
  "AR",
  "BO",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "SV",
  "GT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PY",
  "PE",
  "PR",
  "UY",
  "VE",
] as const;

/** The owner the legal notice names (src/components/Legal.astro): today a person, whose trade name is Retama; once the
 * company exists, its data. */
export interface Owner {
  name: string;
  town: string;
  nif: string | null;
  address: string | null;
}

/** The owner from the build environment (PUBLIC_LEGAL_*, astro.config.mjs), trimmed; an empty NIF or address is none.
 * Null without a name or a town, so the legal notice names nobody rather than half an owner. The data stays out of the
 * public repository. */
export function owner(data: {
  name?: string | undefined;
  town?: string | undefined;
  nif?: string | undefined;
  address?: string | undefined;
}): Owner | null {
  const name = data.name?.trim() ?? "";
  const town = data.town?.trim() ?? "";
  if (!name || !town) return null;
  return { name, town, nif: data.nif?.trim() || null, address: data.address?.trim() || null };
}

/** The WhatsApp link and the number as people read it (+34 600 000 000), from the international number of the build
 * environment (PUBLIC_WHATSAPP_NUMBER, astro.config.mjs) with any "+" or spaces dropped; null without a number, so
 * the page shows no WhatsApp rather than a made-up one. The number stays out of the public repository. */
export function whatsapp(number: string | undefined): { href: string; label: string } | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return {
    href: `https://wa.me/${digits}`,
    label: `+${digits.slice(0, 2)} ${digits.slice(2).replace(/(\d{3})(?=\d)/g, "$1 ")}`,
  };
}

/** The questions chapter of the home, in order: each question with its answer, as i18n keys. The home shows them, and
 * seo.ts repeats them as the FAQPage of the JSON-LD and in llms.txt, so the three always say the same. */
export const questions = [
  ["faq.q1", "faq.a1"],
  ["faq.q2", "faq.a2"],
  ["faq.q3", "faq.a3"],
  ["faq.q4", "faq.a4"],
  ["faq.q5", "faq.a5"],
  ["faq.q6", "faq.a6"],
] as const;

/** The decision sheets, as i18n keys: each kind of project with the first three decisions Retama would record for it,
 * each decision with its reason. The method shows the first four as its projects (DESIGN.md Overview); the service
 * pages show them too. */
export const sheets = {
  web: ["live.web", ["live.web.d1", "live.web.r1"], ["live.web.d2", "live.web.r2"], ["live.web.d3", "live.web.r3"]],
  custom: [
    "live.custom",
    ["live.custom.d1", "live.custom.r1"],
    ["live.custom.d2", "live.custom.r2"],
    ["live.custom.d3", "live.custom.r3"],
  ],
  desktop: [
    "live.desktop",
    ["live.desktop.d1", "live.desktop.r1"],
    ["live.desktop.d2", "live.desktop.r2"],
    ["live.desktop.d3", "live.desktop.r3"],
  ],
  agents: [
    "live.agents",
    ["live.agents.d1", "live.agents.r1"],
    ["live.agents.d2", "live.agents.r2"],
    ["live.agents.d3", "live.agents.r3"],
  ],
} as const;
