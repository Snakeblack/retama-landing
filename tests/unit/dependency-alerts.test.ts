import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const url = (path: string) => new URL(`../../${path}`, import.meta.url);
const read = (path: string) => readFileSync(url(path), "utf8");

const AUDIT_WORKFLOW = ".github/workflows/audit.yml";
const workflow = existsSync(url(AUDIT_WORKFLOW)) ? read(AUDIT_WORKFLOW) : "";
// The dependency gate of the pull requests (ADR 0009); the scheduled audit repeats this very command.
const gate = /^\s*- run: (pnpm audit .+)$/m.exec(read(".github/workflows/ci.yml"))?.[1];

describe("lockfile legible por el dependency graph de GitHub (M7)", () => {
  // pnpm 12 antepone un documento de entorno con su propia versión y GitHub solo lee el primero
  // (dependabot-core#15904): Dependabot dejó de ver todas las dependencias npm sin avisar.
  it("pnpm-lock.yaml es un solo documento YAML, el del proyecto", () => {
    const lockfile = read("pnpm-lock.yaml");
    expect(lockfile.startsWith("lockfileVersion:")).toBe(true);
    expect(lockfile).not.toMatch(/^---$/m);
    expect(lockfile).not.toContain("packageManagerDependencies");
  });

  // Con download, el valor por defecto, o con warn, la siguiente instalación vuelve a escribir el documento de entorno.
  it("pnpm no vuelve a escribir el documento de entorno", () => {
    expect(read("pnpm-workspace.yaml")).toMatch(/^pmOnFail: ignore$/m);
  });

  // Sin el cambio automático de versión de pnpm, packageManager es lo que la fija: el CI la instala con pnpm/action-setup
  // y Workers Builds no construye con otra (scripts/lib/pnpm-pin.mjs).
  it("packageManager sigue fijando una versión exacta de pnpm", () => {
    expect(JSON.parse(read("package.json")).packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });
});

describe("audit programado de dependencias (M7)", () => {
  // Un aviso publicado entre dos pushes no lo ve la puerta de los PR hasta el siguiente cambio.
  it("corre a diario y también a mano", () => {
    expect(workflow).toMatch(/^\s+schedule:\n\s+- cron: "\d+ \d+ \* \* \*"$/m);
    expect(workflow).toMatch(/^\s+workflow_dispatch:$/m);
  });

  it("aplica el mismo umbral y los mismos avisos ignorados que la puerta de los PR", () => {
    expect(gate).toBeDefined();
    expect(workflow).toContain(`- run: ${gate}`);
  });

  // pnpm audit solo lee el lockfile: sin instalar, no se ejecuta ningún script de un paquete.
  it("no instala dependencias y solo lee el repositorio", () => {
    expect(workflow).not.toMatch(/pnpm install|npm (ci|install)/);
    expect(workflow).toMatch(/^permissions:\n\s+contents: read$/m);
  });
});
