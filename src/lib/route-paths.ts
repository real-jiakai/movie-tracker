/** Return the one canonical route for a year. */
export function getYearPath(year: number, newestYear?: number): string {
  return year === newestYear ? "/" : `/${year}/`;
}

/**
 * Return every canonical page path in deterministic order.
 * The homepage represents the newest year, so that year's duplicate route is omitted.
 */
export function getCanonicalYearPaths(years: readonly number[]): string[] {
  const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
  const newestYear = uniqueYears[0];

  return [
    "/",
    ...uniqueYears.slice(1).map((year) => getYearPath(year, newestYear)),
  ];
}
