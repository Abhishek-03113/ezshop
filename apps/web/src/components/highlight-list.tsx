import type { Highlight } from "@ezshop/catalog";

interface HighlightListProps {
  highlights: readonly Highlight[];
}

/** The seller's "About this item" bullets as a card; nothing when the page had none. */
export function HighlightList({ highlights }: HighlightListProps) {
  if (highlights.length === 0) return null;
  return (
    <section className="card highlights" aria-labelledby="highlights-title">
      <h2 id="highlights-title">Highlights</h2>
      <ul>
        {highlights.map((highlight) => (
          <li key={highlight.text}>
            {highlight.heading !== null && <strong>{highlight.heading} </strong>}
            {highlight.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
