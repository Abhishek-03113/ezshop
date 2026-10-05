import { SearchIcon } from "./icons.tsx";

interface SpecSearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
}

/** Live-filtering search field for specs. */
export function SpecSearchBox({ query, onQueryChange }: SpecSearchBoxProps) {
  return (
    <div className="search-box">
      <SearchIcon size={18} />
      <label htmlFor="spec-search" className="visually-hidden">
        Find a spec
      </label>
      <input
        id="spec-search"
        type="search"
        placeholder="Find a spec — try “battery”"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </div>
  );
}
