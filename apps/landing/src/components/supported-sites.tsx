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
    <section id="sites" className="section sites-wrap" aria-labelledby="sites-title">
      <div className="sites">
        <div className="sites-copy">
          <h2 id="sites-title">Works where you shop</h2>
          <p>More stores are on the way.</p>
        </div>
        <ul className="site-list">
          {sites.map((site) => (
            <li key={site.host}>
              <CheckIcon />
              {site.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
