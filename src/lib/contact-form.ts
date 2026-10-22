// What the contact form does with an answer of /api/contact it did not want, and the mail it offers instead.
import type { ContactField } from "./contact";

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
  if (status === 429) return { kind: "rate-limited", fields: [] };
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
