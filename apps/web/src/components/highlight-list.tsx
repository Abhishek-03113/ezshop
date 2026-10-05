import type { Highlight } from "@ezshop/catalog";

interface HighlightListProps {
  highlights: readonly Highlight[];
}

/** The seller's "About this item" bullets, headline first. */
export function HighlightList({ highlights }: HighlightListProps) {
  if (highlights.length === 0) return null;
  return (
    <section className="highlights" aria-labelledby="highlights-title">
      <h2 id="highlights-title">Seller highlights</h2>
      <ul>
        {highlights.map((highlight) => (
          <li key={highlight.text}>
            {highlight.heading !== null && <strong>{highlight.heading}</strong>}
            <span>{highlight.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
