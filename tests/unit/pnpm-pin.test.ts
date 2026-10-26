import { describe, expect, it } from "vitest";
import { unpinnedPnpm } from "../../scripts/lib/pnpm-pin.mjs";

describe("unpinnedPnpm", () => {
  const pinned = "pnpm@12.14.0";
  const agent = (version: string) => `pnpm/${version} npm/? node/v24.11.0 linux x64`;

  // Con pmOnFail: ignore pnpm ya no cambia solo a la versión de packageManager y el lockfile no guarda su hash:
  // Workers Builds, que publica el sitio, no construye con otra.
  it("en Workers Builds admite el pnpm de packageManager", () => {
    expect(unpinnedPnpm({ WORKERS_CI: "1", npm_config_user_agent: agent("12.14.0") }, pinned)).toBeNull();
  });

  it("en Workers Builds rechaza cualquier otra versión de pnpm y la nombra", () => {
    expect(unpinnedPnpm({ WORKERS_CI: "1", npm_config_user_agent: agent("12.15.0") }, pinned)).toBe("12.15.0");
    expect(unpinnedPnpm({ WORKERS_CI: "1", npm_config_user_agent: agent("10.11.1") }, pinned)).toBe("10.11.1");
    expect(unpinnedPnpm({ WORKERS_CI: "1", npm_config_user_agent: agent("12.14.0-rc.1") }, pinned)).toBe(
      "12.14.0-rc.1",
    );
  });

  // Si no se sabe qué pnpm construye, tampoco se sabe si es el fijado.
  it("en Workers Builds rechaza un build que no lanza pnpm", () => {
    expect(unpinnedPnpm({ WORKERS_CI: "1" }, pinned)).toBe("unknown");
    expect(unpinnedPnpm({ WORKERS_CI: "1", npm_config_user_agent: "npm/11.6.2 node/v24.11.0 linux x64" }, pinned)).toBe(
      "unknown",
    );
  });

  // En local cada uno usa su pnpm, y el CI instala el de packageManager con pnpm/action-setup.
  it("fuera de Workers Builds no comprueba nada", () => {
    expect(unpinnedPnpm({ npm_config_user_agent: agent("12.15.0") }, pinned)).toBeNull();
    expect(unpinnedPnpm({}, pinned)).toBeNull();
    expect(unpinnedPnpm({ WORKERS_CI: "0", npm_config_user_agent: agent("10.11.1") }, pinned)).toBeNull();
  });
});
