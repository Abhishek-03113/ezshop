import type { SpecGroup } from "@ezshop/catalog";
import { useState } from "react";
import { countSpecs, filterSpecGroups } from "../specs/filter-spec-groups.ts";
import { SpecGroupTable } from "./spec-group-table.tsx";

interface SpecSheetProps {
  groups: readonly SpecGroup[];
}

/** Every spec group, with a filter box to find one row among dozens. */
export function SpecSheet({ groups }: SpecSheetProps) {
  const [query, setQuery] = useState("");
  const visibleGroups = filterSpecGroups(groups, query);
  return (
    <section className="spec-sheet" aria-labelledby="spec-sheet-title">
      <div className="spec-sheet-head">
        <h2 id="spec-sheet-title">Specifications</h2>
        <input
          type="search"
          placeholder={`Filter ${countSpecs(groups)} specs…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter specifications"
        />
      </div>
      {visibleGroups.length === 0 && <p className="muted">No spec matches “{query}”.</p>}
      <div className="spec-groups">
        {visibleGroups.map((group, index) => (
          <SpecGroupTable key={group.title} group={group} featured={index === 0 && query === ""} />
        ))}
      </div>
    </section>
  );
}
