import { useState } from "react";

export interface LibrarySelection {
  selected: ReadonlySet<string>;
  setSelected: (next: Set<string>) => void;
  clear: () => void;
  /** Confirmation shown after products were added to a comparison; null before. */
  notice: string | null;
  /** Clears the selection and reports which comparison received the products. */
  finishAdding: (comparisonName: string) => void;
}

/**
 * Selection state of the library page: which products are ticked, plus the "Added to …" notice.
 *
 * @example const { selected, setSelected, clear } = useLibrarySelection()
 */
export function useLibrarySelection(): LibrarySelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const clear = () => setSelected(new Set());
  const finishAdding = (comparisonName: string) => {
    clear();
    setNotice(`Added to “${comparisonName}”.`);
  };
  return { selected, setSelected, clear, notice, finishAdding };
}
