// Facts of the board that are the same in every language (DESIGN.md, Imagery and Components).
// The contact channels live here and only here; the owner's personal ones (WhatsApp) come from the build environment.

/** The contact address beside the form; its visible text is the address itself. Cloudflare Email Routing forwards it
 * to the owner's inbox. */
export const contactEmail = "hola@retama.dev";

/** The Cal.com page where a call is booked (the owner's account, event "Llamada"); it shows only while PUBLIC_BOOKING
 * is on (astro.config.mjs). Contact.astro admits its origin, and only it, as a frame. The Turnstile site key is not
 * here: it comes from the build environment (PUBLIC_TURNSTILE_SITE_KEY, astro.config.mjs). */
export const bookingUrl = "https://cal.com/retama/llamada";

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
