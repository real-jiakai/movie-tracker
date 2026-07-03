import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Content Layer API (required since Astro v6 — legacy implicit collections were removed).
// Each markdown file in src/content/movies/ becomes one entry, validated against this schema.
const movies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/movies' }),
  schema: z
    .object({
      title: z.string().min(1),
      // Watch date, e.g. "2025-02-06 21:52:06" (quoted in YAML so it stays a string).
      // Parsed explicitly instead of z.coerce.date() so garbage never coerces silently.
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/, 'date 格式须为 "YYYY-MM-DD" 或 "YYYY-MM-DD HH:mm:ss"')
        .transform((value) => new Date(value.replace(' ', 'T')))
        .refine((date) => !Number.isNaN(date.getTime()), 'date 不是有效日期')
        .refine(
          (date) => date.getTime() < Date.now() + 24 * 60 * 60 * 1000,
          'date 不能是未来时间'
        ),
      // Douban half-star scale: 0–5 in 0.5 steps.
      rating: z.number().min(0).max(5).multipleOf(0.5),
      status: z.string().default('看过'),
      // Empty `review:` parses as null in YAML — normalize missing/empty reviews to "".
      review: z
        .string()
        .nullish()
        .transform((value) => value ?? ''),
      url: z
        .string()
        .regex(/^https:\/\/movie\.douban\.com\/subject\/\d+\/?$/, 'url 须为豆瓣条目链接'),
      type: z.enum(['movie', 'tv']).default('movie'),
      year: z.number().int().optional(),
      isPublic: z.boolean().default(true),
      // https-only so covers are never blocked as mixed content on the https site.
      cover: z.url().refine((value) => value.startsWith('https://'), 'cover 须为 https 链接'),
    })
    // Reject typo'd keys (e.g. isPublik) instead of silently dropping them.
    .strict()
    .superRefine((data, ctx) => {
      if (data.year !== undefined && data.year !== data.date.getFullYear()) {
        ctx.addIssue({
          code: 'custom',
          message: `year (${data.year}) 与 date 的年份 (${data.date.getFullYear()}) 不一致`,
          path: ['year'],
        });
      }
    }),
});

export const collections = { movies };
