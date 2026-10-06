import type { ReactElement } from "react";
import type { LandingLinks } from "../lib/links.ts";
import type { Navigator } from "../lib/product-link.ts";
import { DownloadIcon } from "./icons.tsx";
import { PasteLinkForm } from "./paste-link-form.tsx";

export interface HeroProps {
  readonly links: LandingLinks;
  readonly navigator: Navigator;
}

/** Headline, primary calls to action, the paste-a-link form and the mascot. */
export function Hero({ links, navigator }: HeroProps): ReactElement {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">
          Stop shopping by opening more tabs.
          <span className="hero-turn">Start making better decisions.</span>
        </h1>
        <p className="lede">
          Picky saves products as you browse, turns each one into a clean spec sheet, and shows where your shortlist
          really differs. For Amazon.in and Flipkart.
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
      </div>
      <img
        className="hero-mascot"
        src="/mascot.png"
        width={640}
        height={640}
        alt="Picky, a cream bean wearing teal headphones"
      />
    </section>
  );
}
