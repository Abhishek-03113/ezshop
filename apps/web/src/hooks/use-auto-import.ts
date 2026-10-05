import { useEffect, useState } from "react";
import { RunOnce } from "../import/run-once.ts";

/**
 * Starts an import once when the page was opened with `?import=<url>`; does nothing without a URL.
 *
 * @example useAutoImport(search.import, (url) => importProduct.mutate(url))
 */
export function useAutoImport(importUrl: string | undefined, startImport: (url: string) => void): void {
  const [guard] = useState(() => new RunOnce());
  useEffect(() => {
    if (importUrl === undefined) return;
    guard.run(() => startImport(importUrl));
    // Only the first URL seen counts; later renders must not restart the import.
  }, []);
}
