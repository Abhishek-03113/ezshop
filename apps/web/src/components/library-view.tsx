import type { CatalogComparisonSummary, CatalogProductSummary } from "@ezshop/catalog";
import { useState } from "react";
import { useLibrarySelection } from "../hooks/use-library-selection.ts";
import { pluralize } from "../format/format-count.ts";
import type { StoreFilter } from "../format/source-label.ts";
import { filterProductsByStore } from "../library/filter-products.ts";
import type { GroupKey } from "../library/group-options.ts";
import { groupProducts, type ProductGroup } from "../library/group-products.ts";
import { pruneSelection } from "../library/selection.ts";
import { GroupByMenu } from "./group-by-menu.tsx";
import { LibraryGroupSection } from "./library-group-section.tsx";
import { LibrarySearchBox } from "./library-search-box.tsx";
import { SelectionBar } from "./selection-bar.tsx";
import { StoreFilterControl } from "./store-filter.tsx";

interface LibraryViewProps {
  /** Already narrowed by the server when a search query is set. */
  products: readonly CatalogProductSummary[];
  comparisons: readonly CatalogComparisonSummary[];
  query: string;
  groupKey: GroupKey;
  onQueryCommit: (query: string) => void;
  onGroupChange: (key: GroupKey) => void;
  now: Date;
}

interface LibraryHeaderProps extends LibraryViewProps {
  shownCount: number;
  groupCount: number;
  store: StoreFilter;
  onStoreChange: (store: StoreFilter) => void;
}

function libraryCaption(shownCount: number, sectionCount: number, groupKey: GroupKey, query: string): string {
  const products = pluralize(shownCount, "product");
  if (query !== "") return `${products} matching “${query}”`;
  return groupKey === "none" ? `${products} · newest first` : `${products} in ${pluralize(sectionCount, "group")}`;
}

function LibraryHeader(props: LibraryHeaderProps) {
  const caption = libraryCaption(props.shownCount, props.groupCount, props.groupKey, props.query);
  return (
    <>
      <div className="page-head-text">
        <h1 className="page-title">Library</h1>
        <span className="subtle">{caption}</span>
      </div>
      <LibraryToolbar {...props} />
    </>
  );
}

function LibraryToolbar(props: LibraryHeaderProps) {
  return (
    <div className="library-toolbar">
      <LibrarySearchBox query={props.query} onQueryCommit={props.onQueryCommit} />
      <GroupByMenu selected={props.groupKey} onSelect={props.onGroupChange} />
      <StoreFilterControl selected={props.store} onSelect={props.onStoreChange} />
    </div>
  );
}

/** The populated library: search, grouping, store filter, grouped card sections and the selection bar. */
export function LibraryView(props: LibraryViewProps) {
  const [store, setStore] = useState<StoreFilter>("all");
  const shown = filterProductsByStore(props.products, store);
  const groups = groupProducts(shown, props.groupKey);
  return (
    <main className="page wide library-page">
      <LibraryHeader
        {...props}
        shownCount={shown.length}
        groupCount={groups.length}
        store={store}
        onStoreChange={setStore}
      />
      <LibrarySections
        shown={shown}
        groups={groups}
        comparisons={props.comparisons}
        query={props.query}
        now={props.now}
      />
    </main>
  );
}

interface LibrarySectionsProps {
  shown: readonly CatalogProductSummary[];
  groups: readonly ProductGroup[];
  comparisons: readonly CatalogComparisonSummary[];
  query: string;
  now: Date;
}

/** Owns the selection: the sections tick products, the floating bar acts on them. */
function LibrarySections({ shown, groups, comparisons, query, now }: LibrarySectionsProps) {
  const selection = useLibrarySelection();
  const stillShown = pruneSelection(selection.selected, shown);
  return (
    <>
      {selection.notice !== null && (
        <p className="library-notice" role="status">
          {selection.notice}
        </p>
      )}
      {shown.length === 0 && <EmptyResults query={query} />}
      {groups.map((group) => (
        <LibraryGroupSection
          key={group.id}
          group={group}
          comparisons={comparisons}
          selected={stillShown}
          onSelectionChange={selection.setSelected}
          now={now}
        />
      ))}
      <SelectionBar
        selectedProducts={shown.filter((product) => stillShown.has(product.id))}
        comparisons={comparisons}
        onClear={selection.clear}
        onAdded={selection.finishAdding}
      />
    </>
  );
}

function EmptyResults({ query }: { query: string }) {
  const suffix = query === "" ? "" : ` “${query}”`;
  return <p className="card empty-state">{`No products match${suffix}.`}</p>;
}
