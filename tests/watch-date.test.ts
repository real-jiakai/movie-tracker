import { describe, expect, it } from "vitest";
import {
  formatWatchDate,
  getShanghaiYear,
  isAllowedWatchDate,
  parseWatchDate,
  WATCH_DATE_FUTURE_SLACK_MS,
} from "../src/lib/watch-date";

describe("parseWatchDate", () => {
  it("interprets date-only and timestamp values as Shanghai civil time", () => {
    expect(parseWatchDate("2025-01-02")?.toISOString()).toBe(
      "2025-01-01T16:00:00.000Z",
    );
    expect(parseWatchDate("2025-01-02 08:09:10")?.toISOString()).toBe(
      "2025-01-02T00:09:10.000Z",
    );
  });

  it.each([
    "2025-02-29",
    "2024-02-30",
    "2025-00-10",
    "2025-13-10",
    "2025-01-00",
    "2025-01-32",
    "2025-01-01 24:00:00",
    "2025-01-01 23:60:00",
    "2025-01-01 23:59:60",
  ])("rejects the impossible calendar value %s", (value) => {
    expect(parseWatchDate(value)).toBeNull();
  });

  it("accepts February 29 in a leap year", () => {
    expect(parseWatchDate("2024-02-29")).not.toBeNull();
  });

  it("uses historical Asia/Shanghai daylight-saving rules", () => {
    const date = parseWatchDate("1988-09-10 23:30:00");

    expect(date?.toISOString()).toBe("1988-09-10T14:30:00.000Z");
    expect(date && formatWatchDate(date)).toBe("1988年9月10日");
  });
});

describe("Shanghai date helpers", () => {
  it("formats and groups an instant using Shanghai regardless of the host timezone", () => {
    const instant = new Date("2024-12-31T16:00:00.000Z");

    expect(getShanghaiYear(instant)).toBe(2025);
    expect(formatWatchDate(instant)).toBe("2025年1月1日");
  });

  it("preserves the intentional 24-hour future allowance", () => {
    const now = Date.parse("2025-01-01T00:00:00.000Z");

    expect(
      isAllowedWatchDate(new Date(now + WATCH_DATE_FUTURE_SLACK_MS - 1), now),
    ).toBe(true);
    expect(
      isAllowedWatchDate(new Date(now + WATCH_DATE_FUTURE_SLACK_MS), now),
    ).toBe(false);
  });
});
