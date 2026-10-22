// The contact form's island (ADR 0001, Contact.astro). It enables the button, loads Turnstile on the first focus in
// the form (invisible unless Cloudflare asks for a click), checks the fields with the rules the function uses, sends
// to /api/contact/ and shows what came of it. A failure keeps what was written and offers the mail, prefilled with
// it, and WhatsApp. Nothing is kept once the page goes (ADR 0003).
import { type ContactField, parseContact } from "../lib/contact";
import { type FailureKind, failureOf, mailtoHref } from "../lib/contact-form";

interface Turnstile {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widget: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const ENDPOINT = "/api/contact/";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/** How long a send waits for Turnstile's token before it fails as unverifiable. */
const TOKEN_WAIT = 15_000;

/** One Turnstile widget whose tokens are taken one per send; a token is single-use, so each send resets it. */
function verifier(container: HTMLElement, sitekey: string, language: string) {
  let script: HTMLScriptElement | undefined;
  let widget: string | undefined;
  let token: string | undefined;
  const waiting = new Set<(token: string | undefined) => void>();
  const settle = (value: string | undefined) => {
    if (waiting.size === 0) {
      token = value;
      return;
    }
    for (const resolve of waiting) resolve(value);
    waiting.clear();
  };

  const load = () => {
    if (script) return;
    script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.addEventListener("load", () => {
      widget = window.turnstile?.render(container, {
        sitekey,
        action: "contact",
        appearance: "interaction-only",
        language,
        // The token goes in the JSON body as turnstileToken, not as a form field of its own.
        "response-field": false,
        callback: (value: string) => settle(value),
        "error-callback": () => {
          settle(undefined);
          return true;
        },
        "expired-callback": () => {
          token = undefined;
        },
        "before-interactive-callback": () => container.setAttribute("data-shown", ""),
      });
    });
    // Blocked or offline: the next send tries again.
    script.addEventListener("error", () => {
      script?.remove();
      script = undefined;
      settle(undefined);
    });
    document.head.append(script);
  };

  return {
    load,
    take(): Promise<string | undefined> {
      load();
      if (token) {
        const value = token;
        token = undefined;
        return Promise.resolve(value);
      }
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          waiting.delete(done);
          resolve(undefined);
        }, TOKEN_WAIT);
        const done = (value: string | undefined) => {
          clearTimeout(timer);
          resolve(value);
        };
        waiting.add(done);
      });
    },
    reset() {
      token = undefined;
      if (widget !== undefined) window.turnstile?.reset(widget);
    },
  };
}

const root = document.querySelector<HTMLElement>("[data-contact]");
const form = root?.querySelector("form");
const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');

if (root && form && submit) {
  const { siteKey = "", email = "", subject = "", sending = "" } = root.dataset;
  const label = submit.textContent ?? "";
  const failure = root.querySelector<HTMLElement>("[data-contact-failure]");
  const done = root.querySelector<HTMLElement>("[data-contact-done]");
  const locale = (form.elements.namedItem("locale") as HTMLInputElement).value;
  const turnstile = verifier(root.querySelector<HTMLElement>("[data-turnstile]") ?? root, siteKey, locale);
  let busy = false;

  const values = () => Object.fromEntries(new FormData(form)) as Record<string, string>;
  const invalidFields = () => {
    const result = parseContact({ ...values(), turnstileToken: "" });
    return result.ok ? [] : result.fields;
  };
  const controls = (field: ContactField) => [...form.querySelectorAll<HTMLElement>(`[name="${field}"]`)];

  const mark = (field: ContactField, invalid: boolean) => {
    const message = form.querySelector<HTMLElement>(`[data-error="${field}"]`);
    if (!message) return;
    message.hidden = !invalid;
    // The radios share one message, described by their group.
    const described =
      field === "projectType" ? [form.querySelector<HTMLElement>(`#contact-${field}`)] : controls(field);
    for (const control of described) {
      if (invalid) control?.setAttribute("aria-describedby", message.id);
      else control?.removeAttribute("aria-describedby");
    }
    for (const control of controls(field)) {
      if (invalid) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    }
  };
  const markAll = (fields: ContactField[]) => {
    for (const field of ["name", "email", "projectType", "message"] as const) mark(field, fields.includes(field));
    controls(fields[0] as ContactField)[0]?.focus();
  };

  const showFailure = (kind: FailureKind | undefined) => {
    if (!failure) return;
    failure.hidden = kind === undefined;
    for (const message of failure.querySelectorAll<HTMLElement>("[data-failure]")) {
      message.hidden = message.dataset.failure !== kind;
    }
    const ways = failure.querySelector<HTMLElement>("[data-failure-ways]");
    if (ways) ways.hidden = kind === "invalid";
    const mail = failure.querySelector<HTMLAnchorElement>("[data-contact-mail]");
    const { message = "", name = "" } = values();
    if (mail) mail.href = mailtoHref(email, { subject, message, name });
  };

  const setBusy = (value: boolean) => {
    busy = value;
    submit.disabled = value;
    submit.textContent = value ? sending : label;
    form.toggleAttribute("aria-busy", value);
  };

  form.addEventListener("focusin", turnstile.load, { once: true });

  // A field's message leaves as soon as it is right; new ones only come with the next send.
  form.addEventListener("input", () => {
    const fields = invalidFields();
    for (const field of ["name", "email", "projectType", "message"] as const) {
      if (!fields.includes(field)) mark(field, false);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    showFailure(undefined);
    const fields = invalidFields().filter((field) => field !== "locale" && field !== "turnstileToken");
    if (fields.length > 0) {
      markAll(fields);
      return;
    }

    setBusy(true);
    const turnstileToken = await turnstile.take();
    if (!turnstileToken) {
      turnstile.reset();
      setBusy(false);
      showFailure("verification");
      return;
    }
    let status: number | null = null;
    let body: unknown;
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values(), turnstileToken }),
      });
      status = response.status;
      body = await response.json().catch(() => undefined);
    } catch {
      // The network failed: status stays null.
    }
    setBusy(false);

    if (status === 200) {
      const address = done?.querySelector<HTMLElement>("[data-contact-done-email]");
      if (address) address.textContent = values().email?.trim() ?? "";
      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.focus();
      }
      return;
    }
    turnstile.reset();
    const result = failureOf(status, body);
    if (result.kind === "invalid") markAll(result.fields);
    showFailure(result.kind);
  });

  submit.disabled = false;
}
