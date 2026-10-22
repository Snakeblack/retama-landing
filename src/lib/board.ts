// Facts of the board that are the same in every language (DESIGN.md, Imagery and Components).
// The contact channels live here and only here; PROVISIONAL marks a value that waits for the owner's accounts
// (docs/roadmap.md, M3 dependencies).

/** The contact address beside the form; its visible text is the address itself. */
export const contactEmail = "retamozogpt@gmail.com";

/** PROVISIONAL: the WhatsApp Business number, international format without "+" or spaces. */
export const whatsappNumber = "34600000000";

/** PROVISIONAL: Turnstile's test site key, which always passes; the real one comes from the widget made by hand in
 * the Cloudflare dashboard, paired with TURNSTILE_SECRET_KEY. */
export const turnstileSiteKey = "1x00000000000000000000AA";

/** The number as people read it: +34 600 000 000. */
export const whatsappLabel = `+${whatsappNumber.slice(0, 2)} ${whatsappNumber.slice(2).replace(/(\d{3})(?=\d)/g, "$1 ")}`;
