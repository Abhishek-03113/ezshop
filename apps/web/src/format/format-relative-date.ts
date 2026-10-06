const MS_PER_DAY = 86_400_000;

/** Calendar day of `date` in `timeZone` as a UTC-midnight timestamp, so days can be subtracted exactly. */
function calendarDay(date: Date, timeZone: string | undefined): number {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone })
    .formatToParts(date)
    .reduce<Record<string, number>>((found, part) => ({ ...found, [part.type]: Number(part.value) }), {});
  return Date.UTC(parts["year"] ?? 0, (parts["month"] ?? 1) - 1, parts["day"] ?? 1);
}

/** "today", "yesterday", then "3 Oct" (with the year once it is not the current one). */
function relativeDayLabel(isoTimestamp: string, now: Date, timeZone: string | undefined): string {
  const moment = new Date(isoTimestamp);
  const nowDay = calendarDay(now, timeZone);
  const momentDay = calendarDay(moment, timeZone);
  const daysAgo = Math.round((nowDay - momentDay) / MS_PER_DAY);
  if (daysAgo === 0) return "today";
  if (daysAgo === 1) return "yesterday";
  const sameYear = new Date(nowDay).getUTCFullYear() === new Date(momentDay).getUTCFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone,
  }).format(moment);
}

/**
 * Library-card capture label: "Captured today", "Captured yesterday", then "Captured 3 Oct" (with the year
 * once it is not the current one).
 *
 * @example formatCapturedLabel("2026-10-03T08:00:00Z", new Date("2026-10-05T08:00:00Z"), "UTC") // "Captured 3 Oct"
 */
export function formatCapturedLabel(isoTimestamp: string, now: Date, timeZone?: string): string {
  return `Captured ${relativeDayLabel(isoTimestamp, now, timeZone)}`;
}

/**
 * Comparison-card label, on the same day scale as the capture label: "Updated today", "Updated 3 Oct".
 *
 * @example formatUpdatedLabel("2026-10-04T08:00:00Z", new Date("2026-10-05T08:00:00Z"), "UTC") // "Updated yesterday"
 */
export function formatUpdatedLabel(isoTimestamp: string, now: Date, timeZone?: string): string {
  return `Updated ${relativeDayLabel(isoTimestamp, now, timeZone)}`;
}
