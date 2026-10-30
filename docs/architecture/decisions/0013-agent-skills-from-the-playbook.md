# 0013. Las skills de agente y las reglas de trabajo vienen del playbook de Retama

- Status: accepted
- Date: 2026-10-30
- Supersedes: [0010](0010-vendored-agent-skills.md)

## Context and drivers
El ADR 0010 copiaba, fijaba y auditaba las skills de terceros en este repositorio. Retama tiene ahora un catálogo privado, el playbook, que hace lo mismo una sola vez para todos sus proyectos, con sus reglas de entrega y de diseño. Mantener las dos copias duplica cada auditoría y cada actualización, con un solo responsable (`constraint:solo-team`), y la superficie de inyección de instrucciones y de cadena de suministro sigue ahí (`scenario:privacy-security`).

## Options considered
1. Mantener las copias del ADR 0010: reproducibles en cada PR, pero repiten la auditoría del playbook y se desincronizan de él.
2. Instalar las skills desde sus catálogos públicos: ya descartado en el ADR 0010, porque sus instrucciones cambian sin revisión.
3. Activar los paquetes del playbook, que copia, fija y audita cada skill una vez para todos los proyectos de Retama.

## Decision
Opción 3. La configuración de agente versionada del proyecto solo activa los dos paquetes del playbook que usa: el base y el de animación y 3D. Las skills de terceros, su tema, su precedencia y sus restricciones de uso son las del playbook, y llegan con su bloque de inicio de sesión. El playbook fija cada skill a un commit y la audita antes de que entre, y cada máquina lo lee de un clon que solo avanza con sus releases. En `.claude/skills/` solo viven skills propias del proyecto, sin código ni texto de terceros: Markdown sin hooks, permisos de herramientas, órdenes que se ejecutan al cargarse, enlaces simbólicos ni caracteres invisibles. Fuera de esas skills y de `.claude/settings.json`, el repositorio no versiona nada que el agente cargue de un clon: ni comandos, subagentes o hooks bajo `.claude/`, ni servidores MCP en `.mcp.json`. Ninguna skill se descarga, clona ni copia al usarse, y la configuración versionada no registra ninguna fuente de paquetes ni otra clave: el playbook se registra en cada máquina.

## Consequences
- Más fácil: una sola auditoría y una sola actualización sirven a la landing y a la app, y este repositorio deja de llevar código de terceros.
- Más difícil: una sesión en una máquina sin el playbook registrado no tiene esas skills, y quien lea este repositorio público no ve su contenido. La configuración no puede fijar la versión de un paquete: cada máquina carga la de su clon, y quien mantiene el playbook responde de cada auditoría y de cada release.
- Prohibido: copiar en `.claude/skills/` una skill de terceros o su texto; una skill con hooks, `allowed-tools`, órdenes que se ejecutan al cargarse o ficheros que no sean Markdown; cualquier clave de la configuración versionada que no sea la activación de esos dos paquetes; y cualquier otro fichero versionado bajo `.claude/` o en `.mcp.json`.

## Fitness function
Un test comprueba que bajo `.claude/` solo se versionan `settings.json` y `skills/`, y que no hay `.mcp.json`; que `.claude/settings.json` solo activa los dos paquetes del playbook, sin otra clave; y que cada carpeta de `.claude/skills/` es una skill propia con su `SKILL.md`, solo con Markdown que no es ejecutable ni un enlace simbólico, sin hooks ni `allowed-tools` en el frontmatter, sin órdenes que se ejecutan al cargarse y sin caracteres invisibles.
- Check: `pnpm vitest run tests/unit/agent-setup.test.ts`

## Review trigger
Una skill o una release del playbook aparece comprometida o sin auditar, el playbook deja de servir a la landing, o la landing necesita una skill de terceros, o una propia con scripts, que solo usa ella.
