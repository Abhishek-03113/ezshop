import type { ReactElement } from "react";
import type { LandingLinks } from "../lib/links.ts";

/** Closing call to action. */
export function FinalCta({ links }: { readonly links: LandingLinks }): ReactElement {
  return (
    <section className="section final-cta" aria-labelledby="final-title">
      <img src="/logo-128.png" width={72} height={72} alt="" className="final-mark" />
      <h2 id="final-title" className="h2 h2-large">
        Decide with confidence.
      </h2>
      <p className="sub">Install once, then it's one click on any product page.</p>
      <a className="pill pill-large" href={links.extensionUrl}>
        Add to Chrome
      </a>
    </section>
  );
}
