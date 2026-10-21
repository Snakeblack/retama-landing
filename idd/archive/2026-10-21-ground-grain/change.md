# ground-grain

## Intent and acceptance

Textura de grano en los fondos (opción 2 elegida por el usuario): grano multiplicado en el suelo y en las teselas oscuras, y una capa ligera a un tercio de fuerza sobre todo lo demás

Acceptance: En / y /en/ el suelo, las teselas oscuras y el índice llevan el grano como fondo multiplicado; una capa fija y sin eventos de puntero, al 10 % con multiply, cubre la página sin aclarar la escena ni las letras; las teselas que pasan a field al pasar el puntero no llevan el grano fuerte; DESIGN.md recoge la excepción y ospec check pasa (Lighthouse incluido)

## Plan

1. [x] `src/assets/grain-ground.svg` y `src/assets/grain-layer.svg`: el ruido de la opción 2 tal y como lo vio el usuario en la preview `try/texture-grain`. El build los incrusta en el CSS como data URI.
2. [x] `global.css`: el grano va como fondo multiplicado en el body, en las teselas raised y en el índice. Encima, en `body::after`, una capa fija al 10 % con multiply y sin eventos de puntero.
3. [x] e2e `grain.spec.ts` y DESIGN.md (Elevation & Depth y Do's and Don'ts).

## Decisions

- El usuario eligió la opción 2 «tal y como está ahora» (2026-10-22), después de compararla con la opción 3 (papel con grano en Método) y con la página sin textura en las previews de las ramas desechables.
- Se usa multiply y no un grano blanco: el blanco al 6 % aclaraba la escena y el suelo (medido: suelo de 27,4 a 33,1, escena de 65,8 a 73,0). Con multiply solo oscurece (suelo 24,9, escena 62,5).
- El grano fuerte va en los fondos y no en una capa encima de todo, para que las letras y los botones queden limpios. El percentil 99 del brillo del texto es 237, frente a 231 con la capa fuerte y 240 sin grano. En una tesela oscura, el contraste del grano es el 92 % del de la capa fuerte, con el mismo oscurecimiento medio.
- La escena pinta su propio fondo (`scene.background`), así que solo recibe la capa ligera. Meter el grano en su shader queda como mejora posible, para el change de la escena.
- Los SVG van incrustados y no en `public/`. Como archivos aparte, Lighthouse móvil bajaba a 99 (LCP de 1,7 a 1,8 s, FCP 1,1 s): las dos peticiones entraban en la cadena crítica. Incrustados vuelve a 100 y a 1,7 s, igual que sin grano. La CSP ya permite `img-src data:`.
- En la maqueta, cualquier tesela perdía el grano bajo el puntero (`:not(:hover)`). Aquí solo lo pierden las que pasan a field (`[class~="hover:bg-field"]:hover`), para que el grano no parpadee sobre las teselas estáticas.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T22:06:31.854Z)
- ev-2: check-run for checks-pass (2026-10-21T22:11:24.965Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-21T22:11:24.965Z)
- ev-4: living-doc-current for living-doc (2026-10-21T22:11:35.544Z)
<!-- ospec:evidence:end -->
