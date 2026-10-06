import { filterSpecGroups, specCountLabel, specGroupAnchor, type SpecGroup } from "@picky/catalog";
import { useState } from "react";
import { useFlashValue } from "../hooks/use-flash-value.ts";
import { scrollToAnchor } from "./scroll-to-anchor.ts";
import { SpecGroupCard } from "./spec-group-card.tsx";
import { SpecGroupNav } from "./spec-group-nav.tsx";
import { SpecSearchBox } from "./spec-search-box.tsx";

interface SpecSheetProps {
  groups: readonly SpecGroup[];
}

function NoMatches({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="card empty-state">
      <strong>No specs match “{query.trim()}”</strong>
      <button type="button" className="soft-button" onClick={onClear}>
        Clear search
      </button>
    </div>
  );
}

const HIGHLIGHT_MS = 2000;

/** Every spec group, with live search and chips that jump between groups. */
export function SpecSheet({ groups }: SpecSheetProps) {
  const [query, setQuery] = useState("");
  const visibleGroups = filterSpecGroups(groups, query);
  const [highlighted, highlight] = useFlashValue<string>(HIGHLIGHT_MS);
  const jumpTo = (anchor: string) => {
    scrollToAnchor(anchor);
    highlight(anchor);
  };
  return (
    <section className="spec-sheet" aria-labelledby="spec-sheet-title">
      <div className="spec-sheet-head">
        <div className="page-head-text">
          <h2 id="spec-sheet-title">Specifications</h2>
          <span className="subtle">{specCountLabel(groups, visibleGroups, query)}</span>
        </div>
        <SpecSearchBox query={query} onQueryChange={setQuery} />
      </div>
      <SpecGroupNav groups={visibleGroups} activeAnchor={highlighted} onSelect={jumpTo} />
      {visibleGroups.length === 0 && <NoMatches query={query} onClear={() => setQuery("")} />}
      <div className="spec-groups">
        {visibleGroups.map((group) => (
          <SpecGroupCard key={group.title} group={group} highlighted={specGroupAnchor(group.title) === highlighted} />
        ))}
      </div>
    </section>
  );
}
