import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { agentFilesProblems, settingsProblems, skillsProblems } from "../../scripts/lib/agent-setup.mjs";

const root = new URL("../../", import.meta.url);
const settings = JSON.parse(readFileSync(new URL(".claude/settings.json", root), "utf8"));
const skillsDir = fileURLToPath(new URL(".claude/skills/", root));
const tracked = execFileSync("git", ["ls-files", "-z", "--", ".claude", ".mcp.json"], { cwd: fileURLToPath(root) })
  .toString()
  .split("\0")
  .filter(Boolean);

const playbook = { enabledPlugins: { "retama@retama": true, "retama-motion@retama": true } };

// A .claude/skills with one own skill, plus whatever each case adds.
function skills(extra: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "agent-setup-"));
  mkdirSync(join(dir, "own"));
  writeFileSync(join(dir, "own", "SKILL.md"), "---\nname: own\ndescription: Una skill propia.\n---\n\n# Propia\n");
  extra(dir);
  return dir;
}

describe("skills de agente del playbook de Retama (ADR 0013)", () => {
  it("la configuración y las skills de este repositorio cumplen el ADR", () => {
    expect(agentFilesProblems(tracked)).toEqual([]);
    expect(settingsProblems(settings)).toEqual([]);
    expect(skillsProblems(skillsDir)).toEqual([]);
  });
});

describe("agentFilesProblems", () => {
  it("acepta solo settings.json y las skills bajo .claude", () => {
    expect(agentFilesProblems([".claude/settings.json", ".claude/skills/own/SKILL.md", "AGENTS.md"])).toEqual([]);
  });

  // Comandos, subagentes, hooks, servidores MCP o unos ajustes locales versionados cargarían en cada clon.
  it("rechaza cualquier otro fichero de agente versionado", () => {
    const others = [
      ".claude/commands/deploy.md",
      ".claude/agents/helper.md",
      ".claude/hooks/run.sh",
      ".claude/settings.local.json",
      ".mcp.json",
    ];
    expect(agentFilesProblems(others)).toHaveLength(others.length);
  });
});

describe("settingsProblems", () => {
  it("acepta solo los dos paquetes del playbook, activados", () => {
    expect(settingsProblems(playbook)).toEqual([]);
  });

  // Un hook, una fuente de paquetes o una variable de entorno cargarían en cada sesión de quien clone el repositorio.
  it("rechaza cualquier otra clave", () => {
    for (const key of ["hooks", "extraKnownMarketplaces", "env", "permissions", "apiKeyHelper", "statusLine"]) {
      expect(settingsProblems({ ...playbook, [key]: {} })).toEqual([`settings: unexpected key ${key}`]);
    }
  });

  it("rechaza otro paquete, uno que falta o uno desactivado", () => {
    const other = { enabledPlugins: { ...playbook.enabledPlugins, "other@market": true } };
    expect(settingsProblems(other)).toHaveLength(1);
    expect(settingsProblems({ enabledPlugins: { "retama@retama": true } })).toHaveLength(1);
    expect(settingsProblems({})).toHaveLength(1);
    const off = { enabledPlugins: { ...playbook.enabledPlugins, "retama-motion@retama": false } };
    expect(settingsProblems(off)).toEqual(["settings: retama-motion@retama is not enabled"]);
  });
});

describe("skillsProblems", () => {
  it("acepta una skill propia en Markdown", () => {
    expect(skillsProblems(skills(() => {}))).toEqual([]);
  });

  it("rechaza un manifiesto, una licencia o un script de terceros", () => {
    const dir = skills((d) => {
      writeFileSync(join(d, "manifest.json"), "{}");
      writeFileSync(join(d, "own", "LICENSE"), "MIT");
      writeFileSync(join(d, "own", "run.sh"), "echo");
    });
    expect(skillsProblems(dir)).toEqual(
      expect.arrayContaining([
        "manifest.json: not a skill folder",
        "own/LICENSE: not Markdown",
        "own/run.sh: not Markdown",
      ]),
    );
  });

  it("rechaza una carpeta sin SKILL.md", () => {
    expect(skillsProblems(skills((d) => mkdirSync(join(d, "empty"))))).toEqual(["empty: has no SKILL.md"]);
  });

  it("rechaza un enlace simbólico", () => {
    const dir = skills((d) => symlinkSync("/etc/hostname", join(d, "own", "link.md")));
    expect(skillsProblems(dir)).toEqual(["own/link.md: symlink"]);
  });

  it("rechaza un Markdown ejecutable", () => {
    const dir = skills((d) => chmodSync(join(d, "own", "SKILL.md"), 0o755));
    expect(skillsProblems(dir)).toEqual(["own/SKILL.md: executable"]);
  });

  it("rechaza caracteres invisibles, también los de la tabla de etiquetas de Unicode", () => {
    const hiddens = [
      "\u200B",
      "\u202E",
      "\u2062",
      "\u2066",
      "\u2067",
      "\u2068",
      "\u2069",
      "\u061C",
      "\uFEFF",
      "\u{E0041}",
    ];
    for (const hidden of hiddens) {
      const dir = skills((d) => writeFileSync(join(d, "own", "notes.md"), `texto${hidden}oculto`));
      expect(skillsProblems(dir)).toEqual(["own/notes.md: invisible characters"]);
    }
  });

  it("rechaza hooks en el frontmatter de una skill", () => {
    const dir = skills((d) =>
      writeFileSync(join(d, "own", "SKILL.md"), "---\nname: own\nhooks:\n  PreToolUse: []\n---\n\n# Propia\n"),
    );
    expect(skillsProblems(dir)).toEqual(["own/SKILL.md: hooks in the frontmatter"]);
  });

  it("rechaza hooks o allowed-tools entre comillas o en una línea", () => {
    const fronts = {
      'name: own\n"hooks":\n  Stop: []': "hooks",
      "name: own\nallowed-tools: Bash(rm:*)": "allowed-tools",
      "name: own\n'allowed-tools': [Bash]": "allowed-tools",
      "name: own\nmetadata: { hooks: [] }": "hooks",
    };
    for (const [front, key] of Object.entries(fronts)) {
      const dir = skills((d) => writeFileSync(join(d, "own", "SKILL.md"), `---\n${front}\n---\n\n# Propia\n`));
      expect(skillsProblems(dir)).toEqual([`own/SKILL.md: ${key} in the frontmatter`]);
    }
  });

  // Claude Code ejecuta la orden de !`…` al cargar la skill, antes de que nadie la lea.
  it("rechaza una orden que se ejecuta al cargar la skill", () => {
    const dir = skills((d) => writeFileSync(join(d, "own", "notes.md"), "Estado: !`git status`\n"));
    expect(skillsProblems(dir)).toEqual(["own/notes.md: load-time command"]);
  });

  it("rechaza un bloque de código que se ejecuta al cargar la skill", () => {
    const dir = skills((d) =>
      writeFileSync(join(d, "own", "notes.md"), "Prepara el entorno:\n\n```!\n./setup.sh\n```\n"),
    );
    expect(skillsProblems(dir)).toEqual(["own/notes.md: load-time command"]);
  });

  it("acepta un bloque de código normal", () => {
    const dir = skills((d) => writeFileSync(join(d, "own", "notes.md"), "Ejemplo:\n\n```sh\necho hola\n```\n"));
    expect(skillsProblems(dir)).toEqual([]);
  });
});
