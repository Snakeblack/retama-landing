// What the contact form does with an answer of /api/contact it did not want, the mail it offers instead and the project
// type a link marks in it on arrival.
import { type ContactField, PROJECT_TYPES, type ProjectType } from "./contact";

/** The field a link marks in the form, named as a GET form with it would send it (owner, 2026-10-30). */
const PRESET: ContactField = "projectType";

/** The query a service page's action carries to mark its project type in the home's form (ServicePage.astro). */
export function presetSearch(type: ProjectType): string {
  return `?${new URLSearchParams({ [PRESET]: type })}`;
}

/** The project type a query marks, exactly as the form writes it; any other value marks nothing, without a word. */
export function presetType(search: string): ProjectType | undefined {
  const value = new URLSearchParams(search).get(PRESET);
  return PROJECT_TYPES.find((type) => type === value);
}

/** The fields a visitor can see and fix; the rest of a 400 is the page's fault, not theirs. */
const VISIBLE: readonly ContactField[] = ["name", "email", "projectType", "message"];

export type FailureKind = "invalid" | "verification" | "rate-limited" | "unavailable";
export interface Failure {
  kind: FailureKind;
  /** The fields to mark, in form order; only for "invalid". */
  fields: ContactField[];
}

/** Reads a failed answer of /api/contact (src/pages/api/contact.ts); `status` is null when the network failed. */
export function failureOf(status: number | null, body: unknown): Failure {
  const error = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  if (status === 400 && error.error === "invalid" && Array.isArray(error.fields)) {
    const fields = VISIBLE.filter((field) => (error.fields as unknown[]).includes(field));
    if (fields.length > 0) return { kind: "invalid", fields };
  }
  if (status === 403 && error.error === "verification") return { kind: "verification", fields: [] };
  // Only the function's own limit is worth a wait. A 429 without its body comes from Cloudflare, such as the daily
  // request limit of Workers, which lasts until midnight UTC (ADR 0012).
  if (status === 429 && error.error === "rate-limited") return { kind: "rate-limited", fields: [] };
  return { kind: "unavailable", fields: [] };
}

/** Body length of the prefilled mail: long mailto links are cut or refused by some mail clients. */
export const MAILTO_BODY_MAX = 1500;

/** A mailto link that carries what the visitor wrote, so a failed send costs them nothing. */
export function mailtoHref(address: string, draft: { subject: string; message: string; name: string }): string {
  const signature = draft.name.trim() ? `\n\n${draft.name.trim()}` : "";
  let message = draft.message.trim();
  if (message.length + signature.length > MAILTO_BODY_MAX) {
    message = `${message.slice(0, MAILTO_BODY_MAX - signature.length - 1).trimEnd()}…`;
  }
  const body = message || signature ? `&body=${encodeURIComponent(`${message}${signature}`.trim())}` : "";
  return `mailto:${address}?subject=${encodeURIComponent(draft.subject)}${body}`;
}
