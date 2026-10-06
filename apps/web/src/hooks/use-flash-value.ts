import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A value that reverts to null after `durationMs`; used for "highlight this for a moment" cues.
 * A new flash restarts the timer, so rapid clicks never cut the latest highlight short.
 *
 * @example const [flashed, flash] = useFlashValue<string>(1800); flash("battery")
 */
export function useFlashValue<Value>(durationMs: number): readonly [Value | null, (value: Value) => void] {
  const [value, setValue] = useState<Value | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback(
    (next: Value) => {
      clearTimeout(timer.current);
      setValue(next);
      timer.current = setTimeout(() => setValue(null), durationMs);
    },
    [durationMs],
  );
  return [value, flash] as const;
}
