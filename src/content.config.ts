import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// The schema is the source of truth for project fields. A bad frontmatter
// value fails the build loudly, which is intended — better than a page that
// renders half-empty in production.
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    /** One sentence, shown on cards and in the page meta description. */
    summary: z.string(),
    /** Sort key and the date shown in the label column. */
    year: z.number().int().min(2015).max(2100),
    /** Short discipline tags, e.g. ["CFD", "HPC"]. Two is usually enough. */
    categories: z.array(z.string()).min(1).max(3),
    /**
     * flagship — gets a large figure and the top of the work page
     * standard  — normal card
     */
    tier: z.enum(["flagship", "standard"]).default("standard"),
    /** Basename of an SVG in src/assets/figures, without the extension. */
    figure: z.string(),
    /** Alt text for the figure. Required: these carry real information. */
    figureAlt: z.string(),
    /** Tools actually used. Keep honest and short. */
    stack: z.array(z.string()).default([]),
    /** Optional outbound links (repo, write-up, report). */
    links: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    /** Show on the homepage. */
    featured: z.boolean().default(false),
    /** Lower sorts first within a tier. */
    order: z.number().default(100),
  }),
});

export const collections = { projects };
