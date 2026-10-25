# Alcance funcional

## Actores

| Actor | Tipo | Notas |
| --- | --- | --- |
| Visitante decisor (pyme, startup, estudio, agencia) | Primario | Llega por búsqueda, recomendación o enlace directo |
| Rastreador de buscadores y de motores de IA | Secundario | Necesita HTML completo sin JS |
| Editor (el usuario) | Interno | Edita contenido e i18n en el repo mediante PR |

## Recorridos

1. **Descubrir → convencer → contactar.** El visitante entra en la portada y entiende en menos de 5 s qué hace Retama: titular breve más visual 3D. Después recorre Servicios, Sectores y Método, y elige una vía de contacto.
2. **Contacto por formulario.** El formulario tiene 3–4 campos (nombre, email, tipo de proyecto, mensaje) y pasa una verificación anti-bot invisible.
   - El envío llega a la bandeja principal y a la de respaldo.
   - El visitante ve una confirmación visual.
   - Si el envío falla, el error es claro y se ofrecen las vías alternativas.
3. **Reserva de llamada.** Calendario embebido que se carga **solo al pedirlo** (clic), para no penalizar el rendimiento ni la CSP.
4. **Contacto directo.** `mailto` visible y click-to-chat de WhatsApp.
5. **Cambio de idioma.** Selector es ↔ en que mantiene la página equivalente.
6. **Consentimiento.** v1 no instala cookies de seguimiento, así que no muestra banner. En v2, si se activan heatmaps, primero se pide consentimiento.
7. **Lectura del blog.** Índice por idioma y artículos con SEO completo.

## Capacidades de v1

| Sección o capacidad | Contenido |
| --- | --- |
| Hero | Escena 3D progresiva, titular, una acción principal |
| Servicios | Web y CMS, software a medida, escritorio, agentes y automatización, SEO y analítica, cada uno con su precio «desde» |
| Sectores | Logística, empresa, gaming, otros |
| Método | ADRs y documentación, comunicación para decidir, garantías, 100 % online |
| Quiénes somos | Los dos socios: nombre, función, una frase, retrato (sus iniciales hasta tener la foto) y su perfil público si lo tiene |
| FAQ | Plazos, presupuesto con sus mínimos y el diagnóstico, trabajo remoto, propiedad del código, garantía, mantenimiento |
| Contacto | Formulario, reserva, email, WhatsApp |
| Blog | Artículos en es y en |
| Legales | Aviso legal, privacidad, cookies |
| i18n | `es` por defecto en la raíz y `en` bajo `/en/`; se puede ampliar a otros idiomas |

## Primer slice (walking skeleton)

Una página mínima en es y en desplegada en producción a través de toda la cadena:
- repo, CI con puertas de calidad, preview por rama y producción en `main`;
- CSP y cabeceras activas;
- tokens iniciales de DESIGN.md aplicados;
- sitemap y hreflang;
- Lighthouse 100 medido en CI.

Todavía sin 3D ni contacto. Ver `docs/roadmap.md`.

## Exclusiones

Las de `docs/product/brief.md`, más estas:
- CMS externo: el contenido vive en el repo.
- Base de datos.
