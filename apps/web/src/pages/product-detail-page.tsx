import type { CatalogProduct } from "@ezshop/catalog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { productDetailQuery } from "../api/product-queries.ts";
import { HighlightList } from "../components/highlight-list.tsx";
import { ImageGallery } from "../components/image-gallery.tsx";
import { PriceBlock } from "../components/price-block.tsx";
import { RatingNote } from "../components/rating-note.tsx";
import { SpecSheet } from "../components/spec-sheet.tsx";
import { formatCaptureTime } from "../format/format-date.ts";

const productRouteApi = getRouteApi("/products/$productId");

/** One product as a spec sheet: summary on top, every spec group, then the seller's highlights. */
export function ProductDetailPage() {
  const { productId } = productRouteApi.useParams();
  const { productsClient } = productRouteApi.useRouteContext();
  const { data: product } = useSuspenseQuery(productDetailQuery(productsClient, productId));
  return (
    <article className="detail-page">
      <ProductSummary product={product} />
      <SpecSheet groups={product.snapshot.specGroups} />
      <HighlightList highlights={product.snapshot.highlights} />
    </article>
  );
}

function ProductSummary({ product }: { product: CatalogProduct }) {
  const { snapshot } = product;
  return (
    <header className="summary">
      <ImageGallery images={snapshot.images} alt={snapshot.title} />
      <div className="summary-text">
        <span className="source-tag">
          {snapshot.source} · {snapshot.externalId}
        </span>
        <h1>{snapshot.title}</h1>
        {snapshot.brand !== null && <p className="brand-line">by {snapshot.brand}</p>}
        <PriceBlock price={snapshot.price} listPrice={snapshot.listPrice} />
        {snapshot.availability !== null && <p className="availability">{snapshot.availability}</p>}
        <RatingNote rating={snapshot.rating} />
        <p className="capture-line">
          Captured {formatCaptureTime(snapshot.capturedAt)} ·{" "}
          <a href={snapshot.url} target="_blank" rel="noreferrer">
            View on {snapshot.source}
          </a>
        </p>
      </div>
    </header>
  );
}
