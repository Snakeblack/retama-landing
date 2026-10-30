---
key: web-security-updates
title: "Seguridad web: actualizar sin romper"
description: Lo que ha pasado este año con PHP, Java y Node, por qué una aplicación que nadie toca no está a salvo y cómo actualizamos las nuestras sin cambiar lo que hacen.
published: 2026-10-28
updated: 2026-10-30
---

El 21 de octubre de 2026, PHP y Node.js publicaron arreglos para fallos graves. En agosto, la CISA, la agencia de ciberseguridad de Estados Unidos, ya había avisado de que se estaba atacando un fallo de Apache Tomcat, el servidor sobre el que funcionan muchas aplicaciones hechas en Java. Si tu empresa usa una aplicación web, lo más probable es que funcione con alguna de las tres.

Estos fallos están en las piezas sobre las que se construyen las aplicaciones. Por eso una aplicación que nadie toca va quedando expuesta, aunque funcione igual que el primer día.

## PHP: un fallo que afecta a todos los servidores

Los dos fallos, conocidos como «php2shell» (CVE-2026-109618 y CVE-2026-109619), afectan a cualquier instalación de PHP que sirva páginas web. Quien los aprovecha puede ejecutar sus propios programas en el servidor sin usuario ni contraseña. PHP los corrigió en las versiones 8.5.12, 8.4.27, 8.3.36 y 8.2.35, y el 26 de octubre la CISA [confirmó que ya se usan en ataques](https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching).

Lo peor les toca a las versiones antiguas. PHP 8.1 y las anteriores ya no reciben arreglos, y la CISA recomienda desconectar esos servidores hasta poder actualizarlos. Una web que lleva años sin mantenimiento probablemente esté en ese grupo.

## Java: el arreglo llegó cuatro meses antes que el aviso

En marzo, Apache Tomcat corrigió un fallo en la pieza que cifra los mensajes entre servidores que trabajan en grupo. Ese arreglo tenía a su vez un error (CVE-2026-34486), que [se corrigió a principios de abril](https://tomcat.apache.org/security-11.html). El 4 de agosto, la CISA lo [añadió a su lista de fallos que se aprovechan en ataques reales](https://www.cisa.gov/news-events/alerts/2026/08/04/cisa-adds-three-known-exploited-vulnerabilities-catalog).

Quien instaló el arreglo de abril llevaba cuatro meses protegido cuando llegó el aviso. Quien se quedó en el de marzo creía estar al día, pero tenía el error nuevo.

## Node.js: el riesgo también entra por los paquetes

El 21 de octubre, Node.js [corrigió diez fallos](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) en sus versiones 22, 24 y 26. El más serio (CVE-2026-111497) está en el código que descomprime datos en Brotli, un formato de compresión muy usado en la web: unos datos preparados a propósito pueden dañar la memoria del programa y llegar a ejecutar código. Node.js 20 ya no recibe estos arreglos.

En Node hay además otro riesgo, que crece cada año: los paquetes. Una aplicación normal usa cientos de piezas de código de otras personas, descargadas de npm, el almacén público de paquetes de JavaScript. Si alguien se hace con la cuenta de quien publica una de ellas, puede subir una versión con trampa, y quien la instala se la lleva a su equipo.

- **El 31 de marzo le tocó a axios**, un paquete con más de 100 millones de descargas a la semana. El atacante entró con un engaño en el ordenador de su responsable principal y publicó dos versiones que instalaban un programa para controlar el equipo a distancia. [Estuvieron disponibles unas tres horas](https://github.com/axios/axios/issues/10636).
- **En agosto llegó «ChainDrop»**, un programa que roba las claves de los programadores y las usa para infectar otros paquetes. Según el [aviso de la agencia de ciberseguridad de Singapur](https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2026-009/), afectó a más de 1.300 versiones de paquetes.

## Quedarse atrás o actualizar sin mirar

Uno de los riesgos es quedarse atrás: un servidor con PHP 8.1, o un Tomcat con el arreglo de marzo. El otro, actualizar sin mirar: quien instaló axios en esas tres horas se llevó el problema precisamente por estar al día.

Los dos se evitan con el mismo método: actualizar a menudo, con pasos fijos y sin prisa por lo recién salido.

## Cómo lo hacemos en Retama

Es lo que hacemos en todo lo que construimos y mantenemos, empezando por esta web. También es lo que incluye nuestro mantenimiento mensual, desde 120 € para [una web](/servicios/webs-y-cms/) y 250 € para un software a medida, sin IVA.

- **Guardamos la lista exacta de lo que lleva cada aplicación.** Cada proyecto anota la versión de cada paquete, así que lo que probamos es justo lo que se publica.
- **La comparamos cada día con los fallos conocidos.** Una revisión automática la cruza con las bases públicas de fallos de seguridad cada día y en cada cambio, y nos avisa en cuanto aparece uno.
- **No instalamos lo recién publicado.** Una versión nueva no entra hasta que lleva al menos un día publicada. Las de axios se retiraron a las tres horas, mucho antes de ese plazo.
- **Los paquetes no ejecutan nada al instalarse.** Solo puede hacerlo una lista corta que hemos revisado. La trampa de axios se activaba justo así, al instalar el paquete.
- **Las pruebas deciden.** Cada actualización pasa por pruebas automáticas que comprueban que la aplicación sigue haciendo lo mismo. Unas revisan sus reglas una a una y otras recorren sus pantallas en un navegador de verdad. Si algo cambia, la actualización no se publica hasta saber por qué.
- **Poco a poco.** Actualizamos a menudo y en cambios pequeños, para saber qué ha causado cualquier diferencia y poder deshacer ese cambio.

Nada de esto hace imposible un fallo, pero sí hace que los arreglos lleguen pronto y comprobados, sin cambios en lo que tu equipo usa cada día.

## Si ya tienes una aplicación

Pregunta a quien la mantiene:

- ¿Con qué versión de PHP, Java o Node funciona, y hasta cuándo recibirá arreglos?
- ¿Cuándo se actualizaron sus paquetes por última vez?
- ¿Quién se entera cuando sale un fallo grave, y cuánto se tarda en aplicar el arreglo?
- ¿Hay pruebas automáticas que comprueben que todo sigue igual después de actualizar?

Si alguna no tiene una respuesta clara, conviene revisarlo antes de que salga el próximo aviso.
