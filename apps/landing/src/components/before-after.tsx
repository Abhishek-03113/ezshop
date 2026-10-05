import type { ReactElement } from "react";
import { ArrowIcon, HeadphonesIcon } from "./icons.tsx";

const NOISE_CHIPS: readonly string[] = [
  "Bank offers",
  "No-cost EMI",
  "Exchange offer",
  "Sponsored",
  "Frequently bought together",
  "Protection plans",
];

const SAMPLE_SPECS: readonly (readonly [string, string])[] = [
  ["Noise control", "Active Noise Cancellation"],
  ["Battery life", "40 Hours"],
  ["Bluetooth", "5.2 · 10 Metres"],
  ["Driver", "30 mm Dynamic"],
];

const SKELETON_WIDTHS: readonly number[] = [100, 86, 94, 60];

function ClutteredPage(): ReactElement {
  return (
    <figure className="before">
      <figcaption className="caption">The product page</figcaption>
      <div className="before-head">
        <div className="before-image" />
        <div className="before-lines">
          <i style={{ width: "92%" }} />
          <i style={{ width: "74%" }} />
          <i className="faint" style={{ width: "40%" }} />
        </div>
      </div>
      <ul className="chips">
        {NOISE_CHIPS.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
      <div className="before-body" aria-hidden="true">
        {SKELETON_WIDTHS.map((width) => (
          <i key={width} style={{ width: `${width}%` }} />
        ))}
      </div>
      <p className="before-note">Specs are split across four or five tables, below offers, financing and ads.</p>
    </figure>
  );
}

function SampleSheet(): ReactElement {
  return (
    <figure className="after">
      <figcaption className="caption caption-accent">Your ezshop sheet</figcaption>
      <div className="after-head">
        <div className="after-image">
          <HeadphonesIcon />
        </div>
        <div className="after-title">
          <span className="meta">Sony · Amazon.in</span>
          <span className="product-name">Sony WH-1000XM5 Wireless Noise Cancelling Headphones</span>
          <span className="price-row">
            <span className="price">₹28,926</span>
            <s className="list-price">₹34,990</s>
            <span className="badge">17% off</span>
          </span>
        </div>
      </div>
      <dl className="spec-rows">
        {SAMPLE_SPECS.map(([label, value]) => (
          <div className="spec-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <span className="meta">54 specs in 10 groups, searchable</span>
    </figure>
  );
}

/** Abstract cluttered page next to the real ezshop sheet; target of "See a sample sheet". */
export function BeforeAfter(): ReactElement {
  return (
    <section id="sample" className="section before-after" aria-label="Before and after">
      <div className="compare">
        <ClutteredPage />
        <div className="compare-arrow">
          <ArrowIcon />
        </div>
        <SampleSheet />
      </div>
    </section>
  );
}
