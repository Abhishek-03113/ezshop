import type { Rating } from "@ezshop/catalog";
import { StarIcon } from "./icons.tsx";

const COUNT_FORMAT = new Intl.NumberFormat("en-IN");

/** "★ 4.4 out of 5 · 17,240 ratings"; renders nothing when the page showed no rating. */
export function RatingNote({ rating }: { rating: Rating | null }) {
  if (rating === null) return null;
  const countLabel = `${COUNT_FORMAT.format(rating.count)} ${rating.count === 1 ? "rating" : "ratings"}`;
  return (
    <span className="rating-note">
      <StarIcon />
      <strong>{rating.average.toFixed(1)}</strong>
      <span>{`out of 5 · ${countLabel}`}</span>
    </span>
  );
}
