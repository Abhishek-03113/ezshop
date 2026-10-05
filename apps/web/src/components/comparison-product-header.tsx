import type { CatalogProduct } from "@ezshop/catalog";
import { Link } from "@tanstack/react-router";
import { ratingLine, shortProductName } from "../comparison/comparison-labels.ts";
import { BoxIcon, CloseIcon } from "./icons.tsx";

interface ComparisonProductHeaderProps {
  product: CatalogProduct;
  onRemove: () => void;
}

/** A matrix column head: image, brand, name (links to the spec sheet), rating and a remove button. */
export function ComparisonProductHeader({ product, onRemove }: ComparisonProductHeaderProps) {
  const { snapshot } = product;
  const name = shortProductName(snapshot.title, snapshot.brand);
  const image = snapshot.images[0];
  return (
    <div className="mx-head-cell">
      <div className="mx-head-top">
        <span className="mx-head-image">
          {image === undefined ? <BoxIcon size={40} /> : <img src={image} alt="" />}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={`Remove ${name} from this comparison`}
          onClick={onRemove}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      <span className="mx-head-brand">{snapshot.brand ?? "Unknown brand"}</span>
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="mx-head-name"
        title={snapshot.title}
      >
        {name}
      </Link>
      <span className="mx-head-rating">{ratingLine(snapshot.rating)}</span>
    </div>
  );
}
