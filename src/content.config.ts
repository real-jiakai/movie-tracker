import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Content Layer API (required since Astro v6 — legacy implicit collections were removed).
// Each markdown file in src/content/movies/ becomes one entry, validated against this schema.
const movies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/movies' }),
  schema: z.object({
    title: z.string(),
    // Watch date, e.g. "2025-02-06 21:52:06" — coerced to a Date for sorting/formatting.
    date: z.coerce.date(),
    rating: z.number().min(0).max(5),
    status: z.string().default('看过'),
    // Empty `review:` parses as null in YAML — normalize missing/empty reviews to "".
    review: z
      .string()
      .nullish()
      .transform((value) => value ?? ''),
    url: z.url(),
    // All current entries are "movie"; "tv" is allowed for future TV-series records.
    type: z.enum(['movie', 'tv']).default('movie'),
    year: z.number().optional(),
    isPublic: z.boolean().default(true),
    cover: z.url(),
  }),
});

export const collections = { movies };
