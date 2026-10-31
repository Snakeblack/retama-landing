# Changelog

Todos los cambios notables de este proyecto se documentan en este fichero.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el proyecto sigue
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Hasta la 0.13.0, las entradas las escribía release-please.

## [Unreleased]

## [0.16.1] - 2026-10-31

### Fixed
- La portada (/ y /en/) iba al filo del 100 de rendimiento de Lighthouse y el check del CI fallaba de vez en cuando, también en main. Ahora pide GSAP después del primer pintado, fuera del script de arranque (de ~52 KB a 7 KB gzip), y monta el movimiento en tareas cortas: en local las cinco métricas dan 1,00 (FCP ~920 ms, LCP ≤ 1,51 s, TBT 0). Un capítulo que ya está en pantalla cuando llega el movimiento se queda como viene, y el E2E de las tarjetas de Servicios espera a que la tarjeta esté quieta antes de pulsarla (home-lighthouse-margin)

## [0.16.0] - 2026-10-30

### Added
- Fase 2 de la auditoría SEO de retama.dev: el CTA de cada servicio abre el formulario con su tipo marcado y ofrece la reserva, Retama pasa a OnlineBusiness en el JSON-LD, la firma del blog enlaza al equipo, el artículo de costes trae una tabla de precios atada a services.ts, las URL sin barra final responden 301 y la zona activa Crawler Hints (seo-audit-phase-2)

## [0.15.0] - 2026-10-30

### Added
- Fase 1 de la auditoría SEO de retama.dev (2026-10-30): enlaces entre artículos y servicios, el grano fuera del LCP de las páginas interiores, la home sin desbordes a ancho de tableta, la escena que se rinde antes con una GPU lenta, favicon.ico y apple-touch-icon, lastmod y x-default en el sitemap, logo de la Organization en PNG de al menos 112 px, la marca en hero.lead y el área táctil del enlace del logotipo (seo-audit-phase-1)

## [0.14.0] - 2026-10-30

### Added
- Una página por servicio (webs y CMS, software a medida con el escritorio dentro, agentes y automatización, SEO y analítica) en es y en, enlazada desde las tarjetas de la portada, con canónica, hreflang recíproco, sitemap, JSON-LD Service y BreadcrumbList, imagen Open Graph propia y llms.txt (service-pages)

## [0.13.2] - 2026-10-30

### Changed
- La sección Entrega de AGENTS.md remite a retama:delivery 0.8.0, que ya trae la release con main protegida, en vez de repetir sus pasos (agents-delivery)

## [0.13.1] - 2026-10-30

### Added
- Release with ospec and the playbook's retama:delivery instead of release-please and the landing's own merge script (M3, landing change b) (release-by-ospec)

## [0.13.0](https://github.com/Snakeblack/retama-landing/compare/v0.12.0...v0.13.0) (2026-10-30)


### Features

* **agents:** take the agent skills from the Retama playbook ([2efb2a0](https://github.com/Snakeblack/retama-landing/commit/2efb2a079251224595daf1bc31c9847c1e911eac))
* **copy:** humanize the home's copy with the blog's rules ([2b6f60d](https://github.com/Snakeblack/retama-landing/commit/2b6f60d73a77c049c827ee989439aa9e831566db))

## [0.12.0](https://github.com/Snakeblack/retama-landing/compare/v0.11.0...v0.12.0) (2026-10-28)


### Features

* **blog:** add the article on web security and updating without breaking ([9ec22a3](https://github.com/Snakeblack/retama-landing/commit/9ec22a34743426fa125871f11fe14f8105c80f4b))
* **skills:** add blog-writing, humanizer with the rules of Spanish from Spain ([1ac8d29](https://github.com/Snakeblack/retama-landing/commit/1ac8d294bfe6ab16959b0c99d4b02a961f933255))

## [0.11.0](https://github.com/Snakeblack/retama-landing/compare/v0.10.0...v0.11.0) (2026-10-26)


### Features

* **seo:** point the titles, JSON-LD and sitemap at the business model ([9a01902](https://github.com/Snakeblack/retama-landing/commit/9a019022507c2a163f6c5fd01fa84e1ffce5f3e0))

## [0.10.0](https://github.com/Snakeblack/retama-landing/compare/v0.9.3...v0.10.0) (2026-10-26)


### Features

* **copy:** align the home and the blog with the agreed business model ([2b8b4c5](https://github.com/Snakeblack/retama-landing/commit/2b8b4c5a9f3f8e012ab1eba146f1b7250d80e747))

## [0.9.3](https://github.com/Snakeblack/retama-landing/compare/v0.9.2...v0.9.3) (2026-10-26)


### Bug Fixes

* **contact:** ask to wait only on the function's own rate limit ([970ac7f](https://github.com/Snakeblack/retama-landing/commit/970ac7feb1357ae6f94da1849dc981a8dd5ab51b))
* **deps:** patch the fflate and uuid advisories of the dev tools ([5517dc7](https://github.com/Snakeblack/retama-landing/commit/5517dc70da70eb87ba6d08f92ee82f127cc4b1be))

## [0.9.2](https://github.com/Snakeblack/retama-landing/compare/v0.9.1...v0.9.2) (2026-10-26)


### Bug Fixes

* **worker:** secure every response and keep Astro's own routes out of reach ([c41a901](https://github.com/Snakeblack/retama-landing/commit/c41a901c02865e39064046e8ae008ae6fb659aae))

## [0.9.1](https://github.com/Snakeblack/retama-landing/compare/v0.9.0...v0.9.1) (2026-10-26)


### Bug Fixes

* **deps:** let GitHub's dependency graph read the pnpm lockfile ([3ff3dad](https://github.com/Snakeblack/retama-landing/commit/3ff3dad14c386c464003276c93ad990cf216649a))

## [0.9.0](https://github.com/Snakeblack/retama-landing/compare/v0.8.0...v0.9.0) (2026-10-26)


### Features

* **sectors:** replace gaming with fresh-produce distribution ([9fab6bd](https://github.com/Snakeblack/retama-landing/commit/9fab6bd54b35ffbb736809b69458256337317522))

## [0.8.0](https://github.com/Snakeblack/retama-landing/compare/v0.7.2...v0.8.0) (2026-10-26)


### Features

* **home:** introduce the two partners in a team chapter ([e8c7725](https://github.com/Snakeblack/retama-landing/commit/e8c772586e71e1f7ace64a0589babb2b048c8c28))
* **home:** publish starting prices, the diagnosis and the new warranty ([4e7d3e7](https://github.com/Snakeblack/retama-landing/commit/4e7d3e7ad2124e5a1f6407556728da29574ea9d0))

## [0.7.2](https://github.com/Snakeblack/retama-landing/compare/v0.7.1...v0.7.2) (2026-10-24)


### Bug Fixes

* **report:** mask email addresses written in any script ([fd59e85](https://github.com/Snakeblack/retama-landing/commit/fd59e85584aed189a83fbd8710df6afc90de0f7b))

## [0.7.1](https://github.com/Snakeblack/retama-landing/compare/v0.7.0...v0.7.1) (2026-10-24)


### Bug Fixes

* **contact:** stop following redirects, sandbox the booking frame and refuse test site keys ([c9c6f94](https://github.com/Snakeblack/retama-landing/commit/c9c6f941b39f640f442114999627d3f330976934)), closes [#59](https://github.com/Snakeblack/retama-landing/issues/59)

## [0.7.0](https://github.com/Snakeblack/retama-landing/compare/v0.6.1...v0.7.0) (2026-10-24)


### Features

* **analytics:** measure visits with Cloudflare Web Analytics after load ([5146cef](https://github.com/Snakeblack/retama-landing/commit/5146cefe1d5c6ac659b6261be2c578fc580511d4))
* **report:** log client errors and CSP violations through /api/report/ ([1099411](https://github.com/Snakeblack/retama-landing/commit/109941128790a721c729905c7878e99bc1975f71))


### Bug Fixes

* **deps:** override undici to clear its new high advisory ([c21b5d3](https://github.com/Snakeblack/retama-landing/commit/c21b5d3e1a8605ccfd5d6e6cc7cfdd74f3a397a3))

## [0.6.1](https://github.com/Snakeblack/retama-landing/compare/v0.6.0...v0.6.1) (2026-10-23)


### Bug Fixes

* **deps:** clear the new high advisories in pnpm audit ([09eb7be](https://github.com/Snakeblack/retama-landing/commit/09eb7bed7193d170f2c0897c4e2d060c06835636))

## [0.6.0](https://github.com/Snakeblack/retama-landing/compare/v0.5.0...v0.6.0) (2026-10-23)


### Features

* **platform:** add Workers Logs, Traces and an uptime health check ([c0c0a8e](https://github.com/Snakeblack/retama-landing/commit/c0c0a8edadaf9b877fcd7bed8c9cee442bd1b3e6))

## [0.5.0](https://github.com/Snakeblack/retama-landing/compare/v0.4.1...v0.5.0) (2026-10-23)


### Features

* **platform:** serve production on retama.dev ([d187995](https://github.com/Snakeblack/retama-landing/commit/d187995c576e5f60e3e666976e8c2dd794517b07))

## [0.4.1](https://github.com/Snakeblack/retama-landing/compare/v0.4.0...v0.4.1) (2026-10-23)


### Bug Fixes

* **legal:** let readers select the legal text on touch screens ([6889c4e](https://github.com/Snakeblack/retama-landing/commit/6889c4ea99b5f7b10465a9de5b52df70d3589127))

## [0.4.0](https://github.com/Snakeblack/retama-landing/compare/v0.3.0...v0.4.0) (2026-10-23)


### Features

* **blog:** offer an RSS per language and an image per article ([f3ba8c7](https://github.com/Snakeblack/retama-landing/commit/f3ba8c7e756ca33ecca22e116ebe70591d71a136))
* **blog:** publish articles per language with their own SEO ([90eff44](https://github.com/Snakeblack/retama-landing/commit/90eff446432071fcd53774284ce709526965afb4))


### Bug Fixes

* **blog:** give the RSS address instead of linking to raw XML ([44441ef](https://github.com/Snakeblack/retama-landing/commit/44441ef6e7552a13d85ccc641f5de18db4229ffd))
* **blog:** let readers select an article's text on touch screens ([6b4601d](https://github.com/Snakeblack/retama-landing/commit/6b4601d922925df4b0528274030ad79a511904d5))

## [0.3.0](https://github.com/Snakeblack/retama-landing/compare/v0.2.0...v0.3.0) (2026-10-23)


### Features

* **contact:** show hola@retama.dev as the contact address ([754f684](https://github.com/Snakeblack/retama-landing/commit/754f684fdfc5bcb8071d02d7830c93bd53314750))
* **contact:** take the WhatsApp number from the build environment ([e9cd4d0](https://github.com/Snakeblack/retama-landing/commit/e9cd4d04c87550161e8febe0ebaeb4ee3df19767))
* **home:** answer common questions in a chapter of their own ([65164fd](https://github.com/Snakeblack/retama-landing/commit/65164fd8c52323a5fa38592921ccb1b1000d3ea0))
* **legal:** publish the legal notice, privacy and cookie policies ([683a7ea](https://github.com/Snakeblack/retama-landing/commit/683a7eaf25c5693f4108110fbb2be339e2836866))
* **legal:** take the site owner from the build environment ([b5238c2](https://github.com/Snakeblack/retama-landing/commit/b5238c27c4490f826d1a23509dca8e89b6a1c60e))
* **seo:** describe Retama in JSON-LD on every indexable page ([1672b73](https://github.com/Snakeblack/retama-landing/commit/1672b73988cfec564ce7b3d65b27fb829aa94109))
* **seo:** draw an Open Graph image per language at build time ([eef74b1](https://github.com/Snakeblack/retama-landing/commit/eef74b1b0b70ba48cd75943a3ff04e0862295266))
* **seo:** serve robots.txt and llms.txt built with the site origin ([7b9ed1f](https://github.com/Snakeblack/retama-landing/commit/7b9ed1f63992eb7f18cf14ee4f5208f9cce7e4ca))


### Bug Fixes

* **headers:** serve robots.txt and llms.txt as UTF-8 ([e2c8231](https://github.com/Snakeblack/retama-landing/commit/e2c823120b3559f178c4e2ceb2561f4ac8218756))

## [0.2.0](https://github.com/Snakeblack/retama-landing/compare/v0.1.0...v0.2.0) (2026-10-22)


### Features

* **contact:** add the /api/contact function behind the contact form ([1565262](https://github.com/Snakeblack/retama-landing/commit/1565262ae784425c1e9269f6a12fa264d82a83cf))
* **contact:** add the contact form to the Hablemos chapter ([c2e97d9](https://github.com/Snakeblack/retama-landing/commit/c2e97d907eb9249f0cb1812bcd6d2d8c8384ecc6))
* **contact:** book a call from the contact chapter behind PUBLIC_BOOKING ([40699e1](https://github.com/Snakeblack/retama-landing/commit/40699e169d26783f1476e8568f22827472f90291))
* **contact:** take the Turnstile site key from the build environment ([605efd6](https://github.com/Snakeblack/retama-landing/commit/605efd63f5bc11d3abbc5c29e341053e566c6cb2))
* **design:** adopt the well-kept board art direction ([1500827](https://github.com/Snakeblack/retama-landing/commit/15008276f44ee176c113f5ab4992ecd05356f534))
* **design:** give the grounds a fine grain that only darkens ([66d45bb](https://github.com/Snakeblack/retama-landing/commit/66d45bb8b85f9106d8cc586bba365d34239c85bf))
* **design:** reject loose colours and sizes in components ([d37ffc2](https://github.com/Snakeblack/retama-landing/commit/d37ffc27bd4c3696e4263259e9b6905c740ee748))
* **design:** soften the grain of the grounds ([58be0e1](https://github.com/Snakeblack/retama-landing/commit/58be0e11a7dd5dc48e49de0e8f7511361616122f))
* **design:** soften the grain of the grounds by another fifth ([ea7f4c4](https://github.com/Snakeblack/retama-landing/commit/ea7f4c4ea72f7ed9d8b3cb5d04dac4805603b3d2))
* **header:** float the header over the hero and give phones a chapter index ([91659fb](https://github.com/Snakeblack/retama-landing/commit/91659fbc043906b952ccacbf93606b58a79a4ef7))
* **header:** gather the desktop links on the right, next to the language switch ([6927dd4](https://github.com/Snakeblack/retama-landing/commit/6927dd440f6d0f19057521e736da41d769c816f7))
* **home:** add the motion layer with the shutter, entrances and the code lens ([205bb60](https://github.com/Snakeblack/retama-landing/commit/205bb608d8a4acdecd374445ac9bc7ccdd0f89a3))
* **home:** build the well-kept board with final copy and found pictures ([9ca9714](https://github.com/Snakeblack/retama-landing/commit/9ca9714bfb41f38d54759dcce9125374ef4fd80e))
* **home:** draw the retama poster from a seeded shape ([acce62f](https://github.com/Snakeblack/retama-landing/commit/acce62f57b0da4467f4bea3dc623c2f254c78cf2))
* **home:** drop the code texture from the title ([00e772c](https://github.com/Snakeblack/retama-landing/commit/00e772cac7e27d4d9cd13ae6340f2c3a95803991))
* **home:** grow the retama from glyphs of the site's own code ([5fd7521](https://github.com/Snakeblack/retama-landing/commit/5fd75217e238fbcc61e85c6ca4e9c3e582fc8d03))
* **home:** grow the retama scene in 3D with wind and rising sap ([0fd76e2](https://github.com/Snakeblack/retama-landing/commit/0fd76e2e6f72ecc6391dc1f2821f1d6768adb643))
* **home:** hand the title back to its letters and show its code on hover ([e2266d6](https://github.com/Snakeblack/retama-landing/commit/e2266d6a0bcf5bd36595baa06f9cfffd5d4684b4))
* **home:** keep the retama as a signature and show the work in fragments ([9bec2e7](https://github.com/Snakeblack/retama-landing/commit/9bec2e7778238c4cf83a36142d6dec6ebc1d8680))
* **home:** let the cursor blow stronger wind over the retama ([1d392ca](https://github.com/Snakeblack/retama-landing/commit/1d392caf434dac514ff85e17f439a7be58fcd209))
* **home:** let the scene draw the grain in the first chapter ([6438b6a](https://github.com/Snakeblack/retama-landing/commit/6438b6ac89e88840e09581d2e1311e2f94a01924))
* **home:** paint the title in letters and hand it back once the retama grows ([a35a8f6](https://github.com/Snakeblack/retama-landing/commit/a35a8f6ae91a03d9e909c996504a63a75e87b933))
* **home:** pin the sectors scene with one example fragment per sector ([1f1d1f2](https://github.com/Snakeblack/retama-landing/commit/1f1d1f2d83cc461d5db05e3631d0933a385a9bcc))
* **home:** read the retama down four service cards ([dc40cb2](https://github.com/Snakeblack/retama-landing/commit/dc40cb20c6173b5aa786cc2c06554aba546264a9))
* **home:** set the manifesto at headline size on phones ([4a19511](https://github.com/Snakeblack/retama-landing/commit/4a19511d1c98129d0dee372ffda61530802079f5))
* **home:** sweep the code across the name on touch and stop board selection ([3573f36](https://github.com/Snakeblack/retama-landing/commit/3573f362a8ec2075265a2bdc308dbe769dfcdfec))
* **home:** tell the method without jargon, with the project switcher as its proof ([9e0eed2](https://github.com/Snakeblack/retama-landing/commit/9e0eed23dd354e6cfa6ad84cccc9bf0470716d61))
* **home:** turn the sectors into a compact switcher with live fragments ([7ae7ae4](https://github.com/Snakeblack/retama-landing/commit/7ae7ae4a061391e3bbd8fb00e6cff591bdd0d18a))


### Bug Fixes

* **contact:** bundle the contact island with the rest of the home ([6135f6f](https://github.com/Snakeblack/retama-landing/commit/6135f6fd4035c41ce9f7477c51834a040090d32e))
* **deploy:** give branch previews their own contact limiter ([5d764c0](https://github.com/Snakeblack/retama-landing/commit/5d764c001ffa6887961a030101733d16e6d25f4f))
* **design:** wipe the phone index in instead of flipping it ([154c132](https://github.com/Snakeblack/retama-landing/commit/154c13284859be75f687a7ba686a080016e76e34))
* **header:** give the hero title air under the header and make the index buttons icons ([6d55db1](https://github.com/Snakeblack/retama-landing/commit/6d55db19c02b8578b082b9a2c58745a6a1d1ef29))
* **release:** bump the minor for features before 1.0 ([c89d9a9](https://github.com/Snakeblack/retama-landing/commit/c89d9a9d20dce120a5c4727bbe68ab6b569cb09a))


### Performance Improvements

* **scene:** work the bloom out at a quarter size and drop multisampling ([542c8f1](https://github.com/Snakeblack/retama-landing/commit/542c8f1666c9e5bdcd2c01ebce5ee964ac452a92))

## 0.1.0 (2026-10-21)


### Features

* deliver build-hashed csp and security headers ([23883cd](https://github.com/Snakeblack/retama-landing/commit/23883cdb83ef66574dedb9b27edc9c504eb87191))
* generate tailwind theme from a provisional design.md ([161a82e](https://github.com/Snakeblack/retama-landing/commit/161a82e2acb8380b9dc756bb0625b3277f9a8d24))
* scaffold astro site with es/en routes and seo base ([f5c6187](https://github.com/Snakeblack/retama-landing/commit/f5c61877bf390d604a6dead8f382b3ee64519a42))
* vendor pinned agent skills with manifest and risk scan ([742cfcd](https://github.com/Snakeblack/retama-landing/commit/742cfcd781cf42b28c5d77637af11bb97bb5bf2f))


### Bug Fixes

* **deploy:** enable workers.dev preview urls for branch previews ([2b28e27](https://github.com/Snakeblack/retama-landing/commit/2b28e27a7ccd466af064704935e49084a2e31a16))
* **fitness:** report an unprotected main without a stack trace ([0fc7c18](https://github.com/Snakeblack/retama-landing/commit/0fc7c1867bacc55225ba51d2e43e7dd1d0ef010f))
* **seo:** point site origin at the production workers.dev url ([5736768](https://github.com/Snakeblack/retama-landing/commit/57367684723751dd3b6720ecb467831164d6def1))
* **skills:** flag hosted prompts, home dotfiles and symlinks in the scan ([f278631](https://github.com/Snakeblack/retama-landing/commit/f278631e45938c060416a812ae70ddaaabe91abe))
* **skills:** reject top-level symlinks and stray files in the scan ([a25cf49](https://github.com/Snakeblack/retama-landing/commit/a25cf49871cf15bef4c0c60cf61b31a2cc29b4d5))


### Miscellaneous Chores

* **idd:** close s1 walking skeleton ([#12](https://github.com/Snakeblack/retama-landing/issues/12)) ([1391772](https://github.com/Snakeblack/retama-landing/commit/1391772f44b710028c7b268473cb76aa5e56f8dd))
