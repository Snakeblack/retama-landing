---
version: alpha
name: Retama (provisional)
description: Provisional tokens for the S1 walking skeleton. The art direction (M1) replaces them.
colors:
  primary: "#9ECBFF"
  surface: "#0B0D10"
  on-surface: "#E8EAED"
  on-surface-muted: "#AAB1BB"
  neutral: "#C9CED6"
typography:
  headline-display:
    fontFamily: system-ui
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  body-lg:
    fontFamily: system-ui
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: system-ui
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label-sm:
    fontFamily: system-ui
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.1em
rounded:
  sm: 4px
  md: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  2xl: 96px
  content: 768px
components:
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  lead:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.body-lg}"
  eyebrow:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-sm}"
  link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
---

# Retama

## Overview

Provisional system for the walking skeleton (S1). It only has to be dark, legible and accessible; the art direction chosen in M1 replaces every token. Retama should read as serious, elegant and technically ahead: little text, generous space, strong contrast. The motion budget and the 3D section arrive in M1.

## Colors

- **Primary (#9ECBFF):** a cool sky blue, the only interactive accent (links and the main action).
- **Surface (#0B0D10):** near-black base of every page.
- **On-surface (#E8EAED):** headlines and body text.
- **On-surface muted (#AAB1BB):** eyebrows, captions and metadata.
- **Neutral (#C9CED6):** lead paragraphs, softer than body text.

Every text color passes WCAG AA (4.5:1) on the surface.

## Typography

The system font stack until M1 picks self-hosted typefaces: no font download, no layout shift. One display size for the hero, two body sizes and an uppercase label with wide tracking.

## Layout

Single column, content at most 768px wide, a 4px-based spacing scale. Pages breathe: the hero has 96px of vertical space on each side.

## Shapes

Small radii (4px and 8px) only; no pills until M1 defines components.

## Components

- **page:** base background, text and body typography.
- **lead:** the paragraph under the hero headline.
- **eyebrow:** the label above the headline.
- **link:** text links and the language switch.

## Do's and Don'ts

- Do read this document before any UI work, human or agent (ADR 0005).
- Do regenerate the theme with `pnpm design:theme`; never edit `src/styles/theme.css` by hand.
- Don't use colors or sizes outside these tokens in components.
- Don't add a second accent color.
