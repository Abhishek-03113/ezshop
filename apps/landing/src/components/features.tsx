import type { ReactElement } from "react";

interface Feature {
  readonly title: string;
  readonly body: string;
}

const FEATURES: readonly Feature[] = [
  {
    title: "Grouped specs",
    body: "Every spec table on the page, merged into clear groups such as Audio, Battery and Connectivity.",
  },
  { title: "Price at a glance", body: "Today's price, the list price and the discount, plus stock and rating." },
  { title: "Find any spec", body: "Type “battery” or “weight” to filter the sheet as you type." },
  { title: "Your library", body: "Every product you capture, newest first. Capture it again later to refresh it." },
  { title: "Works from a link", body: "On another device or browser? Paste the product URL instead." },
  { title: "Light and dark", body: "Follows your system appearance automatically." },
];

/** Six-item feature grid. */
export function Features(): ReactElement {
  return (
    <section className="section features" aria-labelledby="features-title">
      <h2 id="features-title" className="h2 features-title">
        Everything on the page that's actually about the product.
      </h2>
      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <div className="feature" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
