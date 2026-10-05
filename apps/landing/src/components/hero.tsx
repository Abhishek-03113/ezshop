import type { ReactElement } from "react";
import type { LandingLinks } from "../lib/links.ts";
import type { Navigator } from "../lib/product-link.ts";
import { DownloadIcon } from "./icons.tsx";
import { PasteLinkForm } from "./paste-link-form.tsx";

export interface HeroProps {
  readonly links: LandingLinks;
  readonly navigator: Navigator;
}

/** Headline, primary calls to action and the paste-a-link form. */
export function Hero({ links, navigator }: HeroProps): ReactElement {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <span className="eyebrow">For Amazon.in and Flipkart product pages</span>
      <h1 id="hero-title">
        The specs.
        <br />
        Without the sales pitch.
      </h1>
      <p className="lede">
        ezshop turns a crowded product page into one clean, grouped spec sheet — one click from the page you're already
        on.
      </p>
      <div className="cta-row">
        <a className="pill pill-large" href={links.extensionUrl}>
          <DownloadIcon />
          Add to Chrome
        </a>
        <a className="pill pill-large pill-quiet" href="#sample">
          See a sample sheet
        </a>
      </div>
      <PasteLinkForm webUrl={links.webUrl} navigator={navigator} />
    </section>
  );
}
