// The contact form's fields and their rules, shared by the form and the /api/contact function.
import { type Locale, locales } from "../i18n/index";

/** The four services plus "other" (DESIGN.md, Layout: the services). */
export const PROJECT_TYPES = ["web", "software", "agents", "seo", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Lengths in UTF-16 code units, the unit of an input's maxlength, after trimming. */
export const LIMITS = { name: 100, email: 254, messageMin: 10, messageMax: 4000, token: 2048 } as const;

export interface ContactInput {
  name: string;
  email: string;
  projectType: ProjectType;
  message: string;
  locale: Locale;
  /** The honeypot: people leave it empty. */
  website: string;
  turnstileToken: string;
}

export type ContactField = keyof ContactInput;
export type ParseResult = { ok: true; value: ContactInput } | { ok: false; fields: ContactField[] };

// A local part, an @ and a domain with at least one dot, no spaces. The mailbox itself is proven by the reply.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

/** Validates an untrusted body. On failure it names every invalid field, in form order. */
export function parseContact(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { ok: false, fields: [] };
  const body = input as Record<string, unknown>;
  const fields: ContactField[] = [];
  const text = (field: ContactField, optional = false): string => {
    const value = body[field];
    if (typeof value === "string") return value.trim();
    if (!(optional && value === undefined)) fields.push(field);
    return "";
  };

  const name = text("name");
  const email = text("email");
  const projectType = text("projectType");
  const message = text("message");
  const locale = text("locale");
  const website = text("website", true);
  const turnstileToken = text("turnstileToken", true);

  const check = (field: ContactField, valid: boolean) => {
    if (!valid && !fields.includes(field)) fields.push(field);
  };
  check("name", name.length > 0 && name.length <= LIMITS.name);
  check("email", email.length <= LIMITS.email && EMAIL.test(email));
  check("projectType", isOneOf(PROJECT_TYPES, projectType));
  check("message", message.length >= LIMITS.messageMin && message.length <= LIMITS.messageMax);
  check("locale", isOneOf(locales, locale));
  check("turnstileToken", turnstileToken.length <= LIMITS.token);

  if (fields.length > 0) {
    const order: ContactField[] = ["name", "email", "projectType", "message", "locale", "website", "turnstileToken"];
    return { ok: false, fields: order.filter((field) => fields.includes(field)) };
  }
  return {
    ok: true,
    value: {
      name,
      email,
      projectType: projectType as ProjectType,
      message,
      locale: locale as Locale,
      website,
      turnstileToken,
    },
  };
}
