import type { CatalogProductSummary } from "@ezshop/catalog";
import { Link } from "@tanstack/react-router";
import { formatCapturedLabel } from "../format/format-relative-date.ts";
import { formatMoney } from "../format/format-money.ts";
import { sourceLabel } from "../format/source-label.ts";
import { BoxIcon } from "./icons.tsx";

interface ProductCardProps {
  product: CatalogProductSummary;
  /** Injected so "Captured today" is deterministic in tests. */
  now: Date;
}

/** One product in the library, linking to its spec sheet. */
export function ProductCard({ product, now }: ProductCardProps) {
  return (
    <Link to="/products/$productId" params={{ productId: product.id }} className="product-card">
      <span className="product-card-image">
        {product.imageUrl === null ? <BoxIcon size={56} /> : <img src={product.imageUrl} alt="" loading="lazy" />}
      </span>
      <span className="product-card-body">
        <span className="product-card-top">
          <span className="product-card-brand">{product.brand ?? "Unknown brand"}</span>
          <span className="chip">{sourceLabel(product.source)}</span>
        </span>
        <span className="product-card-title">{product.title}</span>
        <span className="product-card-price">
          {product.price === null ? <span className="muted">No price</span> : formatMoney(product.price)}
        </span>
        <span className="product-card-date">{formatCapturedLabel(product.updatedAt, now)}</span>
      </span>
    </Link>
  );
}
