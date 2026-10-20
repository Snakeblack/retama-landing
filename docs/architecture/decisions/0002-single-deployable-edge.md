# 0002. Un único desplegable en el borde: activos estáticos y una función de contacto

- Status: accepted
- Date: 2026-10-21

## Context and drivers
Coste casi nulo y uso comercial permitido (`constraint:low-cost`), un solo responsable de producción (`constraint:solo-team`) y validación de entrada en servidor (`scenario:privacy-security`).

## Options considered
1. Servicio backend separado para el contacto: aislamiento claro, pero obliga a operar dos desplegables.
2. Servicio de formularios de un tercero: no hay que mantener código de servidor, pero añade otro encargado del tratamiento, entradas en la CSP y menos control del antispam.
3. Un único desplegable: activos estáticos servidos en el borde más una sola función bajo demanda para el contacto.

## Decision
El sistema es un solo desplegable en una plataforma de borde. Sirve los activos prerenderizados y una única ruta bajo demanda, sin estado, que recibe el contacto.

## Consequences
- Más fácil: un pipeline, un dominio y una CSP.
- Más difícil: la función está sujeta a los límites del runtime del borde (APIs de Node limitadas).
- Prohibido: añadir rutas bajo demanda sin un ADR que lo justifique.

## Fitness function
- Revisión del build: las rutas bajo demanda son exactamente las de la lista permitida (`/api/contact`).
- Check: `node scripts/fitness.mjs on-demand-routes`

## Review trigger
Aparece un segundo caso de uso de servidor (por ejemplo, un chat con IA en v2), o la plataforma cambia de forma que deja de cumplir `constraint:low-cost`.
