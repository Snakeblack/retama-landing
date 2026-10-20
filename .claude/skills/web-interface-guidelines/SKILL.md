---
name: web-interface-guidelines
description: Review UI code in this repository (Astro pages, components, CSS) against Vercel's Web Interface Guidelines, read from the local command.md. Use when asked to review UI, check accessibility or interaction details, or audit a page before merging.
---

# Web Interface Guidelines (local)

Read `command.md` in this folder: it is the upstream rule list, vendored unchanged from
vercel-labs/web-interface-guidelines (see `.claude/skills/manifest.json`). Never fetch the
rules from the network; this copy is the reviewed one (ADR 0010).

Review the files you are given against those rules and report in the output format that
`command.md` describes. Apply these adaptations for this Astro site, which override the
upstream wording:

- **Links:** navigation uses plain `<a href>`; there is no `<Link>` component and no client router (ADR 0006).
- **Keyboard:** native `<a>` and `<button>` already handle the keyboard. Only custom interactive widgets inside islands need `keydown` handlers; prefer native elements instead.
- **State in the URL:** pages are static (ADR 0001). The `useState`/nuqs advice applies only inside an interactive island; state that matters goes in query parameters or separate pages.
- **Images:** the LCP image uses Astro's `<Image>`/`<Picture>` with `loading="eager"` and `fetchpriority="high"`; there is no `priority` prop.
- **Language:** never detect the language to redirect. ADR 0008 serves each locale at its own URL and only *suggests* switching; the language switch is a link to the equivalent page.
- **Design tokens:** colors, sizes and spacing come from DESIGN.md through the generated Tailwind theme (ADR 0005); flag any loose value.
- **Security:** no inline `style=""` attributes or inline event handlers: the CSP has no `unsafe-inline` (ADR 0006).
