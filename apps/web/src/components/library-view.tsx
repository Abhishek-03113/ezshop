import type { CatalogProductSummary } from "@ezshop/catalog";
import { useState } from "react";
import { pluralize } from "../format/format-count.ts";
import type { StoreFilter } from "../format/source-label.ts";
import { filterProductsByStore } from "../library/filter-products.ts";
import { ProductCard } from "./product-card.tsx";
import { StoreFilterControl } from "./store-filter.tsx";

interface LibraryViewProps {
  products: readonly CatalogProductSummary[];
  now: Date;
}

/** The populated library: title, count, store filter and the card grid. */
export function LibraryView({ products, now }: LibraryViewProps) {
  const [store, setStore] = useState<StoreFilter>("all");
  const shown = filterProductsByStore(products, store);
  return (
    <main className="page wide">
      <div className="page-head">
        <div className="page-head-text">
          <h1 className="page-title">Library</h1>
          <span className="subtle">{`${pluralize(shown.length, "product")} · newest first`}</span>
        </div>
        <StoreFilterControl selected={store} onSelect={setStore} />
      </div>
      <ul className="product-grid">
        {shown.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} now={now} />
          </li>
        ))}
      </ul>
    </main>
  );
}
