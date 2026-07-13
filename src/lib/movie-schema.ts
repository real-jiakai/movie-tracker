import { z } from "astro/zod";
import {
  getShanghaiYear,
  isAllowedWatchDate,
  parseWatchDate,
  WATCH_DATE_FORMAT,
  WATCH_DATE_PATTERN,
} from "./watch-date";

const invalidDate = new Date(Number.NaN);

/** Exported separately from the collection so validation can be unit-tested. */
export const movieSchema = z
  .object({
    title: z.string().trim().min(1, "title 不能为空"),
    // Quoted in YAML so the loader passes the exact civil-time string here.
    date: z
      .string()
      .regex(WATCH_DATE_PATTERN, `date 格式须为 "${WATCH_DATE_FORMAT}"`)
      .transform((value) => parseWatchDate(value) ?? invalidDate)
      .refine((date) => !Number.isNaN(date.getTime()), "date 不是有效日期")
      .refine(
        (date) => Number.isNaN(date.getTime()) || isAllowedWatchDate(date),
        "date 不能是未来时间",
      ),
    // Douban half-star scale: 0–5 in 0.5 steps.
    rating: z.number().min(0).max(5).multipleOf(0.5),
    // This collection is a watched journal; wish-list states belong elsewhere.
    status: z.literal("看过").default("看过"),
    // Empty `review:` parses as null in YAML — normalize it to an empty string.
    review: z
      .string()
      .nullish()
      .transform((value) => value ?? ""),
    reviewLang: z.enum(["en", "es"]).optional(),
    url: z
      .string()
      .regex(
        /^https:\/\/movie\.douban\.com\/subject\/\d+\/?$/,
        "url 须为豆瓣条目链接",
      ),
    type: z.enum(["movie", "tv"]).default("movie"),
    year: z.number().int().optional(),
    isPublic: z.boolean().default(true),
    // https-only so covers are never blocked as mixed content on the https site.
    cover: z
      .url()
      .refine((value) => value.startsWith("https://"), "cover 须为 https 链接"),
  })
  // Reject typo'd keys (e.g. isPublik) instead of silently dropping them.
  .strict()
  .superRefine((data, ctx) => {
    if (
      !Number.isNaN(data.date.getTime()) &&
      data.year !== undefined &&
      data.year !== getShanghaiYear(data.date)
    ) {
      ctx.addIssue({
        code: "custom",
        message: `year (${data.year}) 与 date 的上海年份 (${getShanghaiYear(data.date)}) 不一致`,
        path: ["year"],
      });
    }
  });
