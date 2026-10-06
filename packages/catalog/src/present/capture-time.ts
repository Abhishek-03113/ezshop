/**
 * Short, unambiguous capture time such as "5 Oct 2026, 11:29".
 *
 * @example formatCaptureTime("2026-10-05T05:59:30Z", "Asia/Kolkata") // "5 Oct 2026, 11:29"
 */
export function formatCaptureTime(isoTimestamp: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(isoTimestamp));
}
