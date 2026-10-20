# 0003. Sin almacén persistente: los leads solo están en tránsito

- Status: accepted
- Date: 2026-10-21

## Context and drivers
RGPD y minimización de datos (`constraint:rgpd-lssi`), seguridad (`scenario:privacy-security`) y coste nulo (`constraint:low-cost`). El usuario pidió una copia de respaldo de los leads (ronda 8).

## Options considered
1. Base de datos o CRM propio: permite hacer seguimiento, pero hay que custodiar datos personales y fijar retención y copias.
2. Sin almacén: cada lead se entrega por email a una bandeja principal y a una de respaldo.

## Decision
El sistema no guarda datos personales. La función de contacto valida, entrega a dos destinatarios (principal y respaldo) y descarta el contenido. El contenido del sitio se versiona en el repositorio; su único dueño es el editor.

## Consequences
- Más fácil: cumplimiento normativo, ausencia de migraciones y copia de seguridad trivial (el repositorio).
- Más difícil: no hay métricas del pipeline comercial fuera del email.
- Prohibido: registrar en logs el cuerpo del mensaje o el email del remitente.

## Fitness function
- Un test de la función comprueba que los logs no contienen campos personales.
- Revisión: no existen bindings de almacenamiento persistente en la configuración de despliegue.

## Review trigger
Se necesita un CRM o seguimiento de leads dentro del sistema.
