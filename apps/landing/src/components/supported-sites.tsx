import type { ReactElement } from "react";
import { SUPPORTED_SITES, type SupportedSite } from "../lib/sites.ts";
import { CheckIcon } from "./icons.tsx";

/** "Works where you shop". Sites are injectable so tests need not depend on the real list. */
export function SupportedSites({
  sites = SUPPORTED_SITES,
}: {
  readonly sites?: readonly SupportedSite[];
}): ReactElement {
  return (
    <section id="sites" className="section sites" aria-labelledby="sites-title">
      <div className="sites-copy">
        <h2 id="sites-title" className="h2">
          The store is where you buy. Picky is where you decide.
        </h2>
        <p className="sub">
          Today it reads Amazon.in and Flipkart pages. Comparing across stores is where it's headed.
        </p>
      </div>
      <ul className="site-list">
        {sites.map((site) => (
          <li key={site.host}>
            <CheckIcon />
            {site.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
