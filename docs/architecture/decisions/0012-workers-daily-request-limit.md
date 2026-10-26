# 0012. El límite diario de Workers Free se acepta por escrito

- Status: accepted
- Date: 2026-10-26
- Amends: [0011](0011-client-error-reports.md)

## Context and drivers
La auditoría OWASP del 2026-10-26 (M7, `worker-quota`) señaló que cualquiera puede gastar el límite diario del plan Workers Free: 100.000 invocaciones, que se reinician a las 00:00 UTC. Una petición que coincide con un activo no invoca el Worker, y tampoco una navegación del navegador (`Sec-Fetch-Mode: navigate`) a una ruta sin activo, que recibe la 404 de los activos (comportamiento por defecto desde la `compatibility_date` 2025-04-01). Sí lo invocan las dos rutas bajo demanda y toda petición que no es una navegación ni coincide con un activo: escáneres (`/.env`, `wp-includes`), clientes HTTP y el monitor de uptime.

El límite es de la cuenta, no del Worker: lo comparte `retama-app` (`clientes.retama.dev`), que no tiene activos estáticos y cuenta todas sus peticiones. En la analítica de Workers de la cuenta, del 21 al 26 de octubre de 2026, la landing hizo entre 850 y 1.850 invocaciones al día (288 son del uptime de `/api/contact/`) y `retama-app` unas 500: juntas, el 1–2 % del límite.

Al superarlo, Cloudflare responde con el error 1027 a toda petición que invocaría un Worker de la cuenta hasta las 00:00 UTC. En la landing siguen las páginas, los activos y la 404 de los navegadores; caen el formulario y los informes. `retama-app` cae entera.

Pesan el coste nulo (`constraint:low-cost`), un solo responsable (`constraint:solo-team`) y `scenario:privacy-security`, por el que el formulario filtra el abuso.

## Options considered
1. Ampliar la regla de rate limiting del WAF de la zona. El plan gratuito tiene una sola, que ya ocupa `/api/report/`; solo filtra por ruta, cuenta por IP y ubicación y mira ventanas de 10 s. Un límite por IP no protege un límite de la cuenta: la regla actual ya deja unas 86.000 peticiones al día por IP (ADR 0011), así que bastan dos IPs. Además, contaría las peticiones a los activos.
2. Workers Paid (5 $/mes por cuenta): sin límite diario, 10 millones de peticiones al mes incluidas y 0,30 $ por cada millón más. Cambia la caída por un coste acotado y cubre también `retama-app`, pero rompe `constraint:low-cost` cuando ningún tráfico real lo pide.
3. Reglas personalizadas del WAF (5 en el plan gratuito, sin regex) que bloqueen las rutas de escáneres. Quitan ruido, que hoy es en torno al 1 % del límite, pero no frenan un ataque, y son más reglas a mano en una zona que comparte `clientes.retama.dev`.
4. Aceptar el riesgo por escrito, con su impacto, cómo se detecta y cuándo se revisa.

## Decision
Se acepta el riesgo (opción 4). La cuenta sigue en Workers Free y la zona no suma reglas: la de rate limiting sigue solo en `/api/report/` (ADR 0011).

- Impacto aceptado: quien envíe unas 100.000 peticiones que no sean navegaciones ni activos deja sin formulario ni informes a la landing, y sin servicio a `retama-app`, hasta las 00:00 UTC. No se pierden datos, porque la landing no guarda nada (ADR 0003), y la página sigue en pie con el correo y WhatsApp a la vista.
- El formulario solo pide esperar un minuto ante el 429 de la propia función, que trae `{ "error": "rate-limited" }`. Cualquier otro 429, como los de Cloudflare, que no traen ese cuerpo, es un fallo del servicio: el formulario ofrece enviar lo escrito por correo o por WhatsApp (`src/lib/contact-form.ts`).
- Detección: UptimeRobot comprueba `/api/contact/` cada 5 minutos y avisa por email cuando no responde 2xx o 3xx, así que el límite agotado se ve en minutos. El volumen diario se mira en la analítica de Workers de la cuenta en cada auditoría de seguridad; nada lo vigila de forma automática.

Así se completa el riesgo que el ADR 0011 acepta con el cupo de Workers Logs: aquel solo cuesta la visibilidad de los logs; este, también el formulario durante el resto del día.

## Consequences
- Más fácil: coste cero y nada más que mantener a mano en la zona.
- Más difícil: un ataque dirigido o un pico de `retama-app` deja sin formulario a la landing hasta las 00:00 UTC, y lo que gasta un proyecto lo pierde el otro.
- Prohibido: tratar como el límite propio del contacto un 429 sin el cuerpo de la función. Activar `run_worker_first`, `assets_navigation_has_no_effect` o la caché de Workers sin revisar este ADR: harían que los activos o las navegaciones invoquen el Worker o se cobren como si lo hicieran.

## Fitness function
- Test: `pnpm test -- tests/unit/contact-form.test.ts` comprueba que solo el 429 de la función pide esperar.
- Test: `pnpm test -- tests/unit/wrangler-config.test.ts` comprueba que `wrangler.jsonc` no tiene `run_worker_first` ni `assets_navigation_has_no_effect` y que su `compatibility_date` es de 2025-04-01 o posterior.
- Revisión manual en cada auditoría: invocaciones diarias por script de la cuenta (dashboard o GraphQL `workersInvocationsAdaptive`).

## Review trigger
Lo primero que ocurra: `retama-app` abre a clientes reales, o la cuenta supera las 25.000 invocaciones al día (el 25 % del límite) varios días seguidos. Entonces se decide pasar la cuenta a Workers Paid con un ADR que revise `constraint:low-cost`. También, si Cloudflare cambia el límite o lo que cuenta como invocación.
