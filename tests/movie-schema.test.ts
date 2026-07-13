import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { movieSchema } from "../src/lib/movie-schema";

const validMovie = {
  title: "测试电影",
  date: "2025-01-01",
  rating: 4.5,
  status: "看过",
  review: "",
  url: "https://movie.douban.com/subject/1234567/",
  type: "movie",
  year: 2025,
  isPublic: true,
  cover: "https://example.com/poster.webp",
} as const;

describe("movieSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-07-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("trims titles and rejects whitespace-only titles", () => {
    expect(
      movieSchema.parse({ ...validMovie, title: "  测试电影  " }).title,
    ).toBe("测试电影");
    expect(movieSchema.safeParse({ ...validMovie, title: "   " }).success).toBe(
      false,
    );
  });

  it("rejects impossible dates instead of normalizing them", () => {
    expect(
      movieSchema.safeParse({ ...validMovie, date: "2025-02-30" }).success,
    ).toBe(false);
  });

  it("returns a Date whose year is checked in Shanghai", () => {
    const result = movieSchema.parse(validMovie);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toBe("2024-12-31T16:00:00.000Z");
    expect(result.year).toBe(2025);
  });

  it("only accepts watched journal entries", () => {
    expect(
      movieSchema.safeParse({ ...validMovie, status: "想看" }).success,
    ).toBe(false);
    expect(movieSchema.parse({ ...validMovie, status: undefined }).status).toBe(
      "看过",
    );
  });

  it("accepts supported explicit review languages", () => {
    expect(
      movieSchema.parse({ ...validMovie, review: "Hello.", reviewLang: "en" })
        .reviewLang,
    ).toBe("en");
    expect(
      movieSchema.safeParse({ ...validMovie, reviewLang: "fr" }).success,
    ).toBe(false);
  });

  it("rejects dates beyond the 24-hour future allowance", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    expect(
      movieSchema.safeParse({
        ...validMovie,
        date: "2025-01-02 08:00:01",
      }).success,
    ).toBe(false);
  });
});
