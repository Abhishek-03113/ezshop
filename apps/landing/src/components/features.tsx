import type { ReactElement } from "react";

interface Principle {
  readonly title: string;
  readonly body: string;
}

const PRINCIPLES: readonly Principle[] = [
  { title: "Neutral", body: "Picky works for the buyer. It never nudges you toward a product." },
  { title: "Honest", body: "If a page doesn't say, the sheet doesn't guess. Unknown stays unknown." },
  {
    title: "A library you own",
    body: "Research doesn't vanish when a tab closes. Search any spec, and capture a product again to refresh it.",
  },
  { title: "Works from a link", body: "On another device? Paste the product URL instead of installing anything." },
];

/** What Picky promises, in the product's own principles. */
export function Features(): ReactElement {
  return (
    <section className="section features" aria-labelledby="features-title">
      <h2 id="features-title" className="h2">
        Built to help you choose, not to sell.
      </h2>
      <dl className="principles">
        {PRINCIPLES.map((item) => (
          <div key={item.title}>
            <dt>{item.title}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
