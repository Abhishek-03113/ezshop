import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../hooks/use-debounced-value.ts";
import { useSlashFocus } from "../hooks/use-slash-focus.ts";
import { SearchIcon } from "./icons.tsx";

const SEARCH_DEBOUNCE_MS = 250;

interface LibrarySearchBoxProps {
  /** The query currently in the URL. */
  query: string;
  /** Called once the user pauses typing, with the trimmed text ("" clears the search). */
  onQueryCommit: (query: string) => void;
}

/** Library search field: "/" focuses it, typing is debounced before it reaches the URL and the server. */
export function LibrarySearchBox({ query, onQueryCommit }: LibrarySearchBoxProps) {
  const [text, setText] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const settled = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  useSlashFocus(inputRef);
  useEffect(() => {
    if (settled !== query) onQueryCommit(settled);
    // Committing is driven by the typed text settling, not by URL changes made elsewhere.
  }, [settled]);
  return (
    <label className="library-search">
      <SearchIcon size={16} />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search name, brand or spec"
        aria-label="Search library"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <kbd aria-hidden="true">/</kbd>
    </label>
  );
}
