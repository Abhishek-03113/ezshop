import { ratingCountLabel, type Rating } from "@ezshop/catalog";
import { StarIcon } from "./icons.tsx";

/** "★ 4.4 out of 5 · 17,240 ratings"; renders nothing when the page showed no rating. */
export function RatingNote({ rating }: { rating: Rating | null }) {
  if (rating === null) return null;
  return (
    <span className="rating-note">
      <StarIcon />
      <strong>{rating.average.toFixed(1)}</strong>
      <span>{`out of 5 · ${ratingCountLabel(rating.count)}`}</span>
    </span>
  );
}
