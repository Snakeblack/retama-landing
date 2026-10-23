import { describe, expect, it } from "vitest";
import { inMain, mergeVerdict } from "../../scripts/lib/merge-pr.mjs";

const pr = (fields: Record<string, unknown> = {}) => ({
  number: 46,
  state: "OPEN",
  isDraft: false,
  mergeable: "MERGEABLE",
  mergeStateStatus: "CLEAN",
  headRefOid: "2bb3d6b",
  ...fields,
});
const green = [
  { name: "quality", bucket: "pass" },
  { name: "e2e", bucket: "pass" },
  { name: "Workers Builds: retama-landing", bucket: "pass" },
];

describe("mergeVerdict", () => {
  it("deja fusionar un PR abierto, al día y con todos los checks en verde", () => {
    expect(mergeVerdict(pr(), green)).toEqual({ ok: true, reasons: [], allowed: [] });
  });

  it("se niega con un PR por detrás de main y da la orden para ponerlo al día", () => {
    const verdict = mergeVerdict(pr({ mergeStateStatus: "BEHIND" }), green);
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join("\n")).toContain("gh pr update-branch 46 --rebase");
  });

  it("se niega con un PR cerrado, en borrador, en conflicto o sin estado calculado", () => {
    for (const fields of [
      { state: "MERGED" },
      { state: "CLOSED" },
      { isDraft: true },
      { mergeable: "CONFLICTING", mergeStateStatus: "DIRTY" },
      { mergeable: "UNKNOWN", mergeStateStatus: "UNKNOWN" },
      { mergeStateStatus: "BLOCKED" },
    ])
      expect(mergeVerdict(pr(fields), green).ok, JSON.stringify(fields)).toBe(false);
  });

  it("de un PR ya fusionado o cerrado solo dice eso", () => {
    expect(mergeVerdict(pr({ state: "MERGED", mergeable: "UNKNOWN", mergeStateStatus: "UNKNOWN" }), green)).toEqual({
      ok: false,
      reasons: ["the pull request is MERGED, not open"],
      allowed: [],
    });
  });

  it("se niega sin checks o con alguno pendiente", () => {
    expect(mergeVerdict(pr(), []).ok).toBe(false);
    expect(mergeVerdict(pr(), [...green, { name: "lighthouse", bucket: "pending" }]).reasons.join()).toContain(
      "lighthouse",
    );
  });

  it("bloquea un check en rojo salvo que se nombre en --allow-failing, y lo deja escrito", () => {
    const checks = [...green.slice(0, 2), { name: "Workers Builds: retama-landing", bucket: "fail" }];
    const refused = mergeVerdict(pr({ mergeStateStatus: "UNSTABLE" }), checks);
    expect(refused.ok).toBe(false);
    expect(refused.reasons.join()).toContain("Workers Builds: retama-landing");

    const allowed = mergeVerdict(pr({ mergeStateStatus: "UNSTABLE" }), checks, ["Workers Builds: retama-landing"]);
    expect(allowed).toEqual({ ok: true, reasons: [], allowed: ["Workers Builds: retama-landing"] });
  });

  it("no acepta UNSTABLE si el check que falla no es el nombrado", () => {
    const checks = [...green.slice(1), { name: "quality", bucket: "fail" }];
    expect(mergeVerdict(pr({ mergeStateStatus: "UNSTABLE" }), checks, ["Workers Builds: retama-landing"]).ok).toBe(
      false,
    );
  });

  it("trata un check cancelado como uno en rojo, y uno omitido como aceptable", () => {
    expect(mergeVerdict(pr(), [...green, { name: "e2e-extra", bucket: "cancel" }]).ok).toBe(false);
    expect(mergeVerdict(pr(), [...green, { name: "optional", bucket: "skipping" }]).ok).toBe(true);
  });

  it("lista todos los motivos a la vez", () => {
    const verdict = mergeVerdict(pr({ mergeStateStatus: "BEHIND", isDraft: true }), [
      { name: "e2e", bucket: "pending" },
    ]);
    expect(verdict.reasons.length).toBeGreaterThanOrEqual(3);
  });
});

describe("inMain", () => {
  it("da por incluida una rama cuyos commits están todos en main (git cherry con -)", () => {
    expect(inMain("- 17702e6 fix(headers): x\n- 4f0521b feat: y\n")).toBe(true);
    expect(inMain("")).toBe(true);
  });

  it("no da por incluida una rama con algún commit que no está en main (+)", () => {
    expect(inMain("- 17702e6 fix: x\n+ 9fb90b0 feat: y\n")).toBe(false);
  });
});
