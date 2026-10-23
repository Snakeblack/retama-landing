// Facts of the board that are the same in every language (DESIGN.md, Imagery and Components).
// The contact channels live here and only here; the owner's personal ones (WhatsApp) come from the build environment.

/** The contact address beside the form; its visible text is the address itself. Cloudflare Email Routing forwards it
 * to the owner's inbox. */
export const contactEmail = "hola@retama.dev";

/** The Cal.com page where a call is booked (the owner's account, event "Llamada"); it shows only while PUBLIC_BOOKING
 * is on (astro.config.mjs). Contact.astro admits its origin, and only it, as a frame. The Turnstile site key is not
 * here: it comes from the build environment (PUBLIC_TURNSTILE_SITE_KEY, astro.config.mjs). */
export const bookingUrl = "https://cal.com/retama/llamada";

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
