import { describe, expect, it } from "vitest";
import { protectionProblems } from "../../scripts/lib/branch-protection.mjs";

const REQUIRED = ["quality", "e2e", "lighthouse"];
// The fields the GitHub API answers for a protected main, trimmed to the ones the check reads.
const protectedMain = {
  required_pull_request_reviews: { required_approving_review_count: 0 },
  enforce_admins: { enabled: true },
  allow_force_pushes: { enabled: false },
  required_status_checks: {
    strict: true,
    checks: [{ context: "quality" }, { context: "e2e" }, { context: "lighthouse" }],
  },
};

describe("protectionProblems (ADR 0009 y 0014)", () => {
  it("da por buena una main que exige PR, también a los administradores, y todos los checks", () => {
    expect(protectionProblems(protectedMain, REQUIRED)).toEqual([]);
  });

  it("falla si main deja de exigir PR", () => {
    const { required_pull_request_reviews: _, ...withoutPr } = protectedMain;
    expect(protectionProblems(withoutPr, REQUIRED)).toEqual(["main does not require a pull request"]);
  });

  it("falla si alguien puede saltarse el PR, y da por buena una lista de excepciones vacía", () => {
    const withBypass = (bypass_pull_request_allowances: object) => ({
      ...protectedMain,
      required_pull_request_reviews: { required_approving_review_count: 0, bypass_pull_request_allowances },
    });
    expect(protectionProblems(withBypass({ users: [{ login: "owner" }], teams: [], apps: [] }), REQUIRED)).toEqual([
      "1 actor(s) may bypass main's pull request",
    ]);
    expect(protectionProblems(withBypass({ users: [], teams: [], apps: [] }), REQUIRED)).toEqual([]);
  });

  it("falla si main admite force push", () => {
    const protection = { ...protectedMain, allow_force_pushes: { enabled: true } };
    expect(protectionProblems(protection, REQUIRED)).toEqual(["main allows force pushes"]);
  });

  it("falla si la protección deja fuera a los administradores, que podrían subir directo a main", () => {
    const protection = { ...protectedMain, enforce_admins: { enabled: false } };
    expect(protectionProblems(protection, REQUIRED)).toEqual(["main's protection does not apply to admins"]);
  });

  it("nombra los checks obligatorios que faltan, y todos si no exige ninguno", () => {
    const protection = { ...protectedMain, required_status_checks: { strict: true, checks: [{ context: "quality" }] } };
    expect(protectionProblems(protection, REQUIRED)).toEqual(["main does not require: e2e, lighthouse"]);
    const { required_status_checks: _, ...withoutChecks } = protectedMain;
    expect(protectionProblems(withoutChecks, REQUIRED)).toEqual(["main does not require: quality, e2e, lighthouse"]);
  });
});
