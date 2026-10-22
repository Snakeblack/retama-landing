// The call booking of the contact chapter (DESIGN.md, the contact). Cal.com's page goes in a plain iframe, loaded on
// the visitor's click and without Cal.com's embed script, so the CSP only admits it as a frame (ADR 0006).

/** The booking page as Cal.com serves it inside a frame: its embed layout, on the board's dark ground, month view. */
export function bookingEmbedSrc(page: string): string {
  const url = new URL(page);
  url.searchParams.set("embed", "true");
  url.searchParams.set("theme", "dark");
  url.searchParams.set("layout", "month_view");
  return url.href;
}

/** The CSP directive that lets the booking page in as a frame: its origin, nothing wider. */
export function bookingFrameDirective(page: string): `frame-src ${string}` {
  return `frame-src ${new URL(page).origin}`;
}
