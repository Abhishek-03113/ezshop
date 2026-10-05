import { useEffect, useState } from "react";

/**
 * Follows `value` after it has stopped changing for `delayMs`; keeps the search box typing-smooth
 * while the server query and the URL update only once per pause.
 *
 * @example const settled = useDebouncedValue(text, 250)
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
