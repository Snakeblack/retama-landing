# 0011. Una segunda ruta bajo demanda para los informes de errores de cliente y de la CSP

- Status: accepted
- Date: 2026-10-24
- Amends: [0002](0002-single-deployable-edge.md)

## Context and drivers
El ADR 0002 deja una sola ruta bajo demanda, la del contacto, y prohíbe añadir otra sin un ADR. En M6 hay que enterarse de los fallos que solo ocurren en el navegador del visitante: errores de JavaScript y violaciones de la CSP del ADR 0006, que hoy nadie ve. Pesan el coste nulo (`constraint:low-cost`), un solo responsable (`constraint:solo-team`), la privacidad (`scenario:privacy-security`, `constraint:rgpd-lssi`) y el peso de scripts (`scenario:perf-mobile`). El usuario eligió en M6 un endpoint propio frente a un servicio externo.

## Options considered
1. Servicio externo de errores (Sentry o similar): da agrupación y avisos, pero añade un encargado del tratamiento, un origen más en la CSP y un SDK que pesa en el JavaScript de inicio (ADR 0001).
2. Ningún informe: no hay nada que mantener, pero los fallos de cliente y de la CSP siguen sin verse.
3. Una segunda ruta bajo demanda, `/api/report/`, en el mismo Worker y sin estado. Registra cada informe en Workers Logs, que ya recoge los logs del contacto.

## Decision
El desplegable del ADR 0002 suma una segunda ruta bajo demanda, `POST /api/report/`, que también es sin estado. Recibe dos tipos de informe:
- Los errores de JavaScript sin capturar que envía un script pequeño de cada página (`sendBeacon`, con el `Origin` del sitio).
- Las violaciones de la CSP que envía el propio navegador (`report-to` con `Reporting-Endpoints`, y `report-uri` como respaldo).

De cada informe se queda solo con rutas cortas del sitio, sin query ni fragmento, un mensaje corto con sus URLs reducidas a esa ruta o, si son de otro origen, a su origen, los correos enmascarados, la posición y el primer marco de la pila. De la CSP, solo la directiva y el origen bloqueado. Escribe una línea JSON con severidad `warn` en Workers Logs.

La ruta tiene su propio límite, `REPORT_LIMITER`, de 20 informes por minuto e IP (en IPv6, por /64), con contador aparte del contacto y de las Previews. Cuenta cada informe, no cada petición: una petición con varios informes gasta uno por cada línea que escribe. Responde 204 tanto si acepta como si descarta un informe, 413 por encima de 8 KB, 429 por encima del límite y 503 sin el binding. Solo el 503 escribe una línea propia, con severidad de error; los demás rechazos quedan en el evento de invocación, que ya guarda el código de estado. Fuera de estas dos rutas sigue vigente el ADR 0002.

El cupo de Workers Logs (200.000 eventos al día en el plan gratuito) es compartido con el contacto. Una IP puede escribir como mucho 20 líneas `warn` por minuto (28.800 al día). Además, cada petición que llega al Worker deja su evento de invocación, también la que recibe un 429, y eso el límite propio no lo evita. Lo frena antes del Worker la regla de rate limiting del WAF de la zona (la única del plan gratuito): ruta `/api/report/`, 10 peticiones cada 10 s por IP, con bloqueo de 10 s. Así quedan unas 60 invocaciones por minuto e IP como máximo, y en total unos 115.000 eventos al día por IP en el peor caso. Se acepta el riesgo de que unas pocas IPs agoten el cupo: solo se pierde visibilidad de los logs durante ese día, nunca datos ni servicio, y la caída del contacto la avisa el uptime externo, no los logs.

## Consequences
- Más fácil: los fallos de cliente y las violaciones de la CSP se ven en el mismo sitio que los logs del contacto, sin otro proveedor ni otro origen en la CSP.
- Más difícil: no hay agrupación ni avisos de errores. Workers Logs los guarda 3 días y hay que consultarlos a mano. La regla del WAF vive en el dashboard de la zona, fuera de `wrangler.jsonc`, y hay que mantenerla a mano.
- Prohibido: registrar la IP, el user agent, la query o el fragmento de una URL, o el texto de un informe sin pasar por `src/lib/report.ts`. También, añadir una tercera ruta bajo demanda sin otro ADR.

## Fitness function
- Revisión del build: las rutas bajo demanda son exactamente `/api/contact` y `/api/report`.
- Check: `node scripts/fitness.mjs on-demand-routes`
- Un test de la función comprueba que los informes salen sin query, sin correos y sin campos que no estén en la lista: `pnpm test -- tests/unit/report.test.ts`.

## Review trigger
El volumen de informes se acerca al cupo de Workers Logs, hacen falta avisos o agrupación de errores, o aparece un tercer caso de uso de servidor.
