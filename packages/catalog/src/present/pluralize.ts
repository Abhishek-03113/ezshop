/**
 * "1 spec" / "2 specs": a count with its noun, pluralised with a plain "s".
 *
 * @example pluralize(2, "group") // "2 groups"
 */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
