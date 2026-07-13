import { describe, expect, it } from "vitest";

import { getCanonicalYearPaths, getYearPath } from "../src/lib/route-paths";

describe("getYearPath", () => {
  it("maps the newest year to the homepage", () => {
    expect(getYearPath(2026, 2026)).toBe("/");
  });

  it("gives older years a trailing slash", () => {
    expect(getYearPath(2025, 2026)).toBe("/2025/");
  });
});

describe("getCanonicalYearPaths", () => {
  it("keeps only the homepage when there are no public years", () => {
    expect(getCanonicalYearPaths([])).toEqual(["/"]);
  });

  it("sorts and deduplicates years while omitting the newest duplicate route", () => {
    expect(getCanonicalYearPaths([2024, 2026, 2025, 2025])).toEqual([
      "/",
      "/2025/",
      "/2024/",
    ]);
  });
});
