import type { Rating } from "@ezshop/catalog";

const COUNT_FORMAT = new Intl.NumberFormat("en-IN");

/** Rating as a quiet footnote: ezshop puts specs ahead of reviews on purpose. */
export function RatingNote({ rating }: { rating: Rating | null }) {
  if (rating === null) return null;
  return (
    <p className="rating-note">
      {rating.average.toFixed(1)} / 5 from {COUNT_FORMAT.format(rating.count)} ratings
    </p>
  );
}
