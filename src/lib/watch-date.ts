export const SHANGHAI_TIME_ZONE = "Asia/Shanghai";
export const WATCH_DATE_FORMAT = "YYYY-MM-DD or YYYY-MM-DD HH:mm:ss";
export const WATCH_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/;

const SHANGHAI_STANDARD_OFFSET_MS = 8 * 60 * 60 * 1000;
export const WATCH_DATE_FUTURE_SLACK_MS = 24 * 60 * 60 * 1000;

interface CivilDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: SHANGHAI_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

const yearFormatter = new Intl.DateTimeFormat("en", {
  timeZone: SHANGHAI_TIME_ZONE,
  year: "numeric",
});

const civilPartsFormatter = new Intl.DateTimeFormat(
  "en-CA-u-ca-gregory-nu-latn",
  {
    timeZone: SHANGHAI_TIME_ZONE,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  },
);

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function asUtcTimestamp(parts: CivilDateTime): number {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return date.getTime();
}

function getShanghaiCivilParts(date: Date): CivilDateTime | null {
  const values = new Map(
    civilPartsFormatter
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const required = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
  ] as const;
  if (required.some((part) => !values.has(part))) return null;

  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    second: Number(values.get("second")),
  };
}

/** Resolve an IANA-zone civil time and reject clock-skipped local times. */
function resolveShanghaiCivilTime(parts: CivilDateTime): Date | null {
  const targetTimestamp = asUtcTimestamp(parts);
  let candidateTimestamp = targetTimestamp - SHANGHAI_STANDARD_OFFSET_MS;

  // Recalculate from the zone's rendered civil time so historical Shanghai
  // daylight-saving offsets (1986-1991) are handled without host-TZ leakage.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const rendered = getShanghaiCivilParts(new Date(candidateTimestamp));
    if (!rendered) return null;

    const adjustment = targetTimestamp - asUtcTimestamp(rendered);
    if (adjustment === 0) return new Date(candidateTimestamp);
    candidateTimestamp += adjustment;
  }

  return null;
}

/**
 * Strictly parses a watch date as Shanghai civil time.
 *
 * Returning `null` instead of relying on the built-in Date parser prevents
 * calendar overflow such as February 30 from being silently normalized.
 */
export function parseWatchDate(value: string): Date | null {
  const match = WATCH_DATE_PATTERN.exec(value);
  if (!match) return null;

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText = "00",
    minuteText = "00",
    secondText = "00",
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  return resolveShanghaiCivilTime({ year, month, day, hour, minute, second });
}

export function formatWatchDate(date: Date): string {
  return dateFormatter.format(date);
}

export function getShanghaiYear(date: Date = new Date()): number {
  return Number(yearFormatter.format(date));
}

export function isAllowedWatchDate(date: Date, now = Date.now()): boolean {
  const timestamp = date.getTime();
  return (
    !Number.isNaN(timestamp) && timestamp < now + WATCH_DATE_FUTURE_SLACK_MS
  );
}
