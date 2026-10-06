import { type CatalogProductSummary, formatMoney } from "@ezshop/catalog";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { productListQuery } from "../api/product-queries.ts";
import { useDebouncedValue } from "../hooks/use-debounced-value.ts";
import { useDismiss } from "../hooks/use-dismiss.ts";
import { SearchIcon } from "./icons.tsx";

const rootRouteApi = getRouteApi("__root__");
const PICKER_DEBOUNCE_MS = 250;

interface AddProductPanelProps {
  /** Products already in the comparison; shown as "Added" and not clickable. */
  memberIds: ReadonlySet<string>;
  onAdd: (productId: string) => void;
  onClose: () => void;
}

/** Picker over the whole library with the same server search as the library page. Stays open to add several. */
export function AddProductPanel({ memberIds, onAdd, onClose }: AddProductPanelProps) {
  const { productsClient } = rootRouteApi.useRouteContext();
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), PICKER_DEBOUNCE_MS);
  const { data: products = [] } = useQuery(productListQuery(productsClient, query));
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(panelRef, true, onClose);
  return (
    <div className="picker-panel" role="dialog" aria-label="Add product to comparison" ref={panelRef}>
      <label className="filter-field">
        <SearchIcon size={15} />
        <input
          autoFocus
          type="search"
          placeholder="Search your library"
          aria-label="Search your library"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <PickerList products={products} memberIds={memberIds} onAdd={onAdd} />
    </div>
  );
}

interface PickerListProps {
  products: readonly CatalogProductSummary[];
  memberIds: ReadonlySet<string>;
  onAdd: (productId: string) => void;
}

function pickerMeta(product: CatalogProductSummary, isMember: boolean): string {
  if (isMember) return "Added";
  return product.price === null ? "No price" : formatMoney(product.price);
}

function PickerList({ products, memberIds, onAdd }: PickerListProps) {
  if (products.length === 0) return <p className="hint picker-empty">No products match.</p>;
  return (
    <ul className="picker-list">
      {products.map((product) => (
        <li key={product.id}>
          <button
            type="button"
            className="picker-item"
            disabled={memberIds.has(product.id)}
            onClick={() => onAdd(product.id)}
          >
            <span className="picker-item-title">{product.title}</span>
            <span className="picker-item-meta">{pickerMeta(product, memberIds.has(product.id))}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
