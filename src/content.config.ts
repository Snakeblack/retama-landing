import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { locales } from "./i18n/index";

// The blog: one Markdown file per article and language, src/content/blog/<locale>/<slug>.md, so each language has its
// own slug. The translations of an article share its key; src/lib/blog.ts (checkArticles) fails the build when one is
// missing (ADR 0008).
const blog = defineCollection({
  loader: glob({ pattern: `{${locales.join(",")}}/*.md`, base: "./src/content/blog" }),
  schema: z.object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    description: z.string().min(1),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { blog };
