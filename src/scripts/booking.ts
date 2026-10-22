// The call booking's island (ADR 0001, Contact.astro). The action is a plain link to Cal.com; with this script a
// plain click frames the calendar in the contact chapter instead, once per visit, and Close hides it and gives the
// focus back to the action. Nothing reaches Cal.com before that click, and nothing goes into the URL.
const action = document.querySelector<HTMLAnchorElement>("[data-booking-open]");
const tile = document.querySelector<HTMLElement>("[data-booking]");
const slot = tile?.querySelector<HTMLElement>("[data-booking-frame]");
const dismiss = tile?.querySelector<HTMLButtonElement>("[data-booking-close]");

if (action && tile && slot && dismiss) {
  const { src = "", title = "" } = slot.dataset;
  let frame: HTMLIFrameElement | undefined;

  action.setAttribute("aria-controls", tile.id);
  action.setAttribute("aria-expanded", "false");

  const show = (shown: boolean) => {
    tile.hidden = !shown;
    action.setAttribute("aria-expanded", String(shown));
  };

  action.addEventListener("click", (event) => {
    // A new tab or window keeps the link's own behaviour.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!frame) {
      frame = document.createElement("iframe");
      frame.src = src;
      frame.title = title;
      frame.className = "size-full";
      slot.append(frame);
    }
    show(true);
    frame.focus();
  });

  dismiss.addEventListener("click", () => {
    show(false);
    action.focus();
  });
}
