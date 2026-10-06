import type { CatalogComparisonSummary } from "@picky/catalog";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateComparison } from "../hooks/use-comparison-mutations.ts";
import { ALL_PRODUCTS_GROUP_NAME, type ProductGroup } from "../library/group-products.ts";
import { groupAction, groupMeta } from "../library/group-summary.ts";
import { toggleSelected } from "../library/selection.ts";
import { ChevronDownIcon } from "./icons.tsx";
import { ProductCard } from "./product-card.tsx";

interface LibraryGroupSectionProps {
  group: ProductGroup;
  comparisons: readonly CatalogComparisonSummary[];
  selected: ReadonlySet<string>;
  onSelectionChange: (next: Set<string>) => void;
  now: Date;
}

/** One collapsible section: name, "N products · ₹min – ₹max", the compare action and the cards. */
export function LibraryGroupSection(props: LibraryGroupSectionProps) {
  const { group, comparisons } = props;
  const [expanded, setExpanded] = useState(true);
  const flat = group.name === ALL_PRODUCTS_GROUP_NAME;
  return (
    <section aria-label={group.name} className="group-section">
      {!flat && (
        <GroupHeader
          group={group}
          comparisons={comparisons}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      )}
      {(flat || expanded) && <GroupCards {...props} />}
    </section>
  );
}

function GroupCards({ group, selected, onSelectionChange, now }: LibraryGroupSectionProps) {
  return (
    <ul className="product-grid">
      {group.products.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            now={now}
            selection={{
              active: selected.size > 0,
              selected: selected.has(product.id),
              onToggle: () => onSelectionChange(toggleSelected(selected, product.id)),
            }}
          />
        </li>
      ))}
    </ul>
  );
}

interface GroupHeaderProps {
  group: ProductGroup;
  comparisons: readonly CatalogComparisonSummary[];
  expanded: boolean;
  onToggle: () => void;
}

function GroupHeader({ group, comparisons, expanded, onToggle }: GroupHeaderProps) {
  return (
    <div className="group-header">
      <button type="button" className="group-toggle" aria-expanded={expanded} onClick={onToggle}>
        <span className={expanded ? "chevron" : "chevron collapsed"}>
          <ChevronDownIcon size={14} />
        </span>
        <h2>{group.name}</h2>
      </button>
      <span className="subtle">{groupMeta(group)}</span>
      <GroupActionButton group={group} comparisons={comparisons} />
    </div>
  );
}

function GroupActionButton({ group, comparisons }: Pick<GroupHeaderProps, "group" | "comparisons">) {
  const createComparison = useCreateComparison();
  const action = groupAction(group, comparisons);
  if (action.kind === "open") {
    return (
      <Link to="/comparisons/$comparisonId" params={{ comparisonId: action.comparison.id }} className="group-action">
        {action.label}
      </Link>
    );
  }
  const productIds = group.products.map((product) => product.id);
  return (
    <button
      type="button"
      className="group-action"
      disabled={createComparison.isPending}
      onClick={() => createComparison.mutate({ name: group.name, productIds })}
    >
      {action.label}
    </button>
  );
}
