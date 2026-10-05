import type { CatalogProductSummary } from "@ezshop/catalog";
import { Link } from "@tanstack/react-router";
import { formatMoney } from "../format/format-money.ts";

/** One product in the list, linking to its spec sheet. */
export function ProductCard({ product }: { product: CatalogProductSummary }) {
  return (
    <Link to="/products/$productId" params={{ productId: product.id }} className="product-card">
      <div className="product-card-image">
        {product.imageUrl !== null && <img src={product.imageUrl} alt="" loading="lazy" />}
      </div>
      <div className="product-card-body">
        <span className="source-tag">{product.source}</span>
        <h3>{product.title}</h3>
        <p className="product-card-meta">
          {product.brand ?? "Unknown brand"}
          {product.price !== null && <strong>{formatMoney(product.price)}</strong>}
        </p>
      </div>
    </Link>
  );
}
