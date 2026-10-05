import { useState } from "react";

export type RowMode = "differences" | "all";

export interface MatrixControls {
  mode: RowMode;
  setMode: (mode: RowMode) => void;
  query: string;
  setQuery: (query: string) => void;
  markBest: boolean;
  setMarkBest: (markBest: boolean) => void;
}

/**
 * State behind the compare toolbar: which rows to show, the spec filter and the "Mark best values" switch.
 * Starts on Differences with best values marked, the brief's defaults.
 *
 * @example const controls = useMatrixControls(); controls.setMode("all")
 */
export function useMatrixControls(): MatrixControls {
  const [mode, setMode] = useState<RowMode>("differences");
  const [query, setQuery] = useState("");
  const [markBest, setMarkBest] = useState(true);
  return { mode, setMode, query, setQuery, markBest, setMarkBest };
}
