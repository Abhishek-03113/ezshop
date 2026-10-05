const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a path parameter can be a Postgres uuid. Postgres raises on a malformed uuid; callers
 * treat that as "not found" instead.
 *
 * @example isUuid("not-a-uuid") // false
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
