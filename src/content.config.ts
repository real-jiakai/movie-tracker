import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { movieSchema } from "./lib/movie-schema";

// Content Layer API (required since Astro v6 — legacy implicit collections were removed).
// Each markdown file in src/content/movies/ becomes one entry, validated against this schema.
const movies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/movies" }),
  schema: movieSchema,
});

export const collections = { movies };
