import type { ReactElement } from "react";

interface Row {
  readonly label: string;
  readonly values: readonly [string, string];
  /** Index of the clearly better side, when one is. */
  readonly winner?: 0 | 1;
}

const PRODUCTS: readonly [string, string] = ["Headphones A", "Headphones B"];

const SHARED: readonly string[] = ["Bluetooth 5.2", "Over-ear", "Active noise cancellation", "USB-C charging"];

const ROWS: readonly Row[] = [
  { label: "Battery life", values: ["40 hours", "30 hours"], winner: 0 },
  { label: "Weight", values: ["250 g", "290 g"], winner: 0 },
  { label: "Price", values: ["₹28,926", "₹24,990"], winner: 1 },
  { label: "Ear cushions", values: ["Soft synthetic", "Memory foam"] },
];

function Cell({ row, side }: { readonly row: Row; readonly side: 0 | 1 }): ReactElement {
  const wins = row.winner === side;
  return (
    <td className={wins ? "wins" : undefined}>
      {row.values[side]}
      {wins && <span className="wins-tag"> · Better</span>}
    </td>
  );
}

/** Illustrative comparison: shared specs fold away, differences are split into "better" and "your call". */
export function ComparePreview(): ReactElement {
  return (
    <section id="compare" className="section compare-section" aria-labelledby="compare-title">
      <div className="compare-copy">
        <h2 id="compare-title" className="h2">
          Only what differs gets your attention.
        </h2>
        <p className="sub">
          Identical specs stay out of the way. When more battery or less weight is simply better, Picky says so. When it
          comes down to taste, like screen size, it leaves the call to you.
        </p>
      </div>
      <figure className="compare-sheet">
        <table>
          <caption className="visually-hidden">Sample comparison of two headphones</caption>
          <thead>
            <tr>
              <td />
              {PRODUCTS.map((name) => (
                <th scope="col" key={name}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <Cell row={row} side={0} />
                <Cell row={row} side={1} />
              </tr>
            ))}
          </tbody>
        </table>
        <figcaption className="compare-foot">
          <span>Same on both: {SHARED.join(", ")}.</span>
          <span>Ear cushions come down to preference, so neither side is marked. Sample data.</span>
        </figcaption>
      </figure>
    </section>
  );
}
