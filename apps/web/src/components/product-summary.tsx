import type { ProductSnapshot } from "@ezshop/catalog";
import { sourceLabel } from "../format/source-label.ts";
import { HighlightList } from "./highlight-list.tsx";
import { ImageGallery } from "./image-gallery.tsx";
import { PriceCard } from "./price-card.tsx";
import { RatingNote } from "./rating-note.tsx";

/** Top of the spec sheet: gallery on one side; brand, title, rating, price and highlights on the other. */
export function ProductSummary({ snapshot }: { snapshot: ProductSnapshot }) {
  return (
    <section className="summary">
      <ImageGallery images={snapshot.images} alt={snapshot.title} />
      <div className="summary-text">
        <div className="summary-heading">
          <span className="summary-meta">
            {snapshot.brand !== null && <span className="summary-brand">{snapshot.brand}</span>}
            <span className="chip">{sourceLabel(snapshot.source)}</span>
          </span>
          <h1>{snapshot.title}</h1>
          <RatingNote rating={snapshot.rating} />
        </div>
        <PriceCard snapshot={snapshot} />
        <HighlightList highlights={snapshot.highlights} />
      </div>
    </section>
  );
}
