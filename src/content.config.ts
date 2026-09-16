import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * One file per project. The entry id is the file name, and it doubles as the
 * program id used by the desktop and by the ?open= deep link, so a project
 * always has one name across the whole site.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    repo: z.url(),
    /** Language GitHub reports for the repository. */
    language: z.string().optional(),
    /** Where it runs, when that matters, e.g. "Minecraft 1.21.1, NeoForge". */
    platform: z.string().optional(),
    /** Left out until the owner says what to claim. */
    status: z.string().optional(),
    order: z.number(),
  }),
});

export const collections = { projects };
