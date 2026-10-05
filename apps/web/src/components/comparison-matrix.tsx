import { flipkartSearchUrl, type CatalogProduct, type ComparisonGroup, type ComparisonMatrix } from "@ezshop/catalog";
import type { CSSProperties } from "react";
import { pluralize } from "../format/format-count.ts";
import { ExternalLinkIcon } from "./icons.tsx";
import { MatrixRow } from "./comparison-cells.tsx";
import { ComparisonProductHeader } from "./comparison-product-header.tsx";

interface ComparisonMatrixViewProps {
  products: readonly CatalogProduct[];
  matrix: ComparisonMatrix;
  markBest: boolean;
  differencesOnly: boolean;
  onRemove: (productId: string) => void;
}

/** One column per product, sized by a CSS variable; the scroll box lets narrow screens pan sideways. */
function columnStyle(count: number): CSSProperties {
  return { "--columns": count } as CSSProperties;
}

/** The comparison table: sticky product header, Price section, then spec groups. */
export function ComparisonMatrixView({
  products,
  matrix,
  markBest,
  differencesOnly,
  onRemove,
}: ComparisonMatrixViewProps) {
  return (
    <section aria-label="Comparison table" className="matrix-scroll">
      <div className="mx mx-head" style={columnStyle(products.length)}>
        <div className="mx-corner">Specs of {pluralize(products.length, "product")}</div>
        {products.map((product) => (
          <ComparisonProductHeader key={product.id} product={product} onRemove={() => onRemove(product.id)} />
        ))}
      </div>
      <div role="table" aria-label="Specifications" className="mx" style={columnStyle(products.length)}>
        <PriceSection products={products} matrix={matrix} markBest={markBest} />
        {matrix.groups.map((group) => (
          <SpecGroupRows key={group.title} group={group} markBest={markBest} />
        ))}
        {differencesOnly && matrix.groups.every((group) => group.rows.length === 0) && (
          <p className="mx-note">No differences: every spec matches. Switch to “All specs” to see them.</p>
        )}
      </div>
    </section>
  );
}

function PriceSection({
  products,
  matrix,
  markBest,
}: Pick<ComparisonMatrixViewProps, "products" | "matrix" | "markBest">) {
  return (
    <>
      <div className="mx-group">Price</div>
      <MatrixRow label="Best price" cells={matrix.prices} markBest={markBest} pill="Lowest" />
      <MatrixRow label="Rating" cells={matrix.ratings} markBest={markBest} pill={null} />
      <div role="row" className="mx-row">
        <div role="rowheader" className="mx-label">
          Flipkart
        </div>
        {products.map((product) => (
          <FlipkartCell key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

function FlipkartCell({ product }: { product: CatalogProduct }) {
  if (product.snapshot.source === "flipkart.com") {
    return (
      <div role="cell" className="mx-value none">
        This listing
      </div>
    );
  }
  return (
    <div role="cell" className="mx-value">
      <a href={flipkartSearchUrl(product.snapshot)} target="_blank" rel="noreferrer" className="mx-link">
        Search Flipkart <ExternalLinkIcon size={12} />
      </a>
    </div>
  );
}

function SpecGroupRows({ group, markBest }: { group: ComparisonGroup; markBest: boolean }) {
  if (group.rows.length === 0) return null;
  return (
    <>
      <div className="mx-group">
        {group.title}
        {group.identicalCount > 0 && <span className="mx-hidden">{group.identicalCount} identical hidden</span>}
      </div>
      {group.rows.map((row) => (
        <MatrixRow key={row.key} label={row.label} cells={row.cells} markBest={markBest} pill="Best" />
      ))}
    </>
  );
}
