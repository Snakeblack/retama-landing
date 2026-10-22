// Facts of the board that are the same in every language (DESIGN.md, Imagery and Components).
// The contact channels live here and only here; PROVISIONAL marks a value that waits for the owner's accounts
// (docs/roadmap.md, M3 dependencies).

/** The contact address beside the form; its visible text is the address itself. */
export const contactEmail = "retamozogpt@gmail.com";

/** PROVISIONAL: the WhatsApp Business number, international format without "+" or spaces. */
export const whatsappNumber = "34600000000";

/** The Cal.com page where a call is booked (the owner's account, event "Llamada"); it shows only while PUBLIC_BOOKING
 * is on (astro.config.mjs). Contact.astro admits its origin, and only it, as a frame. The Turnstile site key is not
 * here: it comes from the build environment (PUBLIC_TURNSTILE_SITE_KEY, astro.config.mjs). */
export const bookingUrl = "https://cal.com/retama/llamada";

/** The number as people read it: +34 600 000 000. */
export const whatsappLabel = `+${whatsappNumber.slice(0, 2)} ${whatsappNumber.slice(2).replace(/(\d{3})(?=\d)/g, "$1 ")}`;
