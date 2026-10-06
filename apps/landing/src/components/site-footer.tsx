import type { ReactElement } from "react";
import { appHomeUrl, type LandingLinks } from "../lib/links.ts";

/** Disclaimer and secondary links. */
export function SiteFooter({ links }: { readonly links: LandingLinks }): ReactElement {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>Picky is not affiliated with Amazon or Flipkart.</span>
        <span className="footer-links">
          <a href="#top">Privacy</a>
          <a href={appHomeUrl(links)}>Open app</a>
        </span>
      </div>
    </footer>
  );
}
