// Provisional walking-skeleton copy; the final copy lands in M2.
export const es = {
  "meta.title": "Retama · Ingeniería de software",
  "meta.description":
    "Retama diseña y construye aplicaciones web, software a medida y automatizaciones para empresas. Arquitectura documentada y trabajo 100 % en remoto.",
  "home.title": "Software a medida, con criterio.",
  "home.lead":
    "Aplicaciones web, software a medida y automatización para empresas que necesitan un equipo técnico fiable.",
  "nav.switchLabel": "Read in English",
  "notFound.title": "Página no encontrada",
  "notFound.lead": "La página que buscas no existe o ha cambiado de dirección.",
  "notFound.back": "Volver al inicio",
} as const;

export type Dictionary = Record<keyof typeof es, string>;
