import type { ReactElement } from "react";
import type { LandingLinks } from "../lib/links.ts";
import type { Navigator } from "../lib/product-link.ts";
import { BeforeAfter } from "./before-after.tsx";
import { FinalCta } from "./final-cta.tsx";
import { Features } from "./features.tsx";
import { Hero } from "./hero.tsx";
import { HowItWorks } from "./how-it-works.tsx";
import { NavBar } from "./nav-bar.tsx";
import { SiteFooter } from "./site-footer.tsx";
import { SupportedSites } from "./supported-sites.tsx";

export interface LandingPageProps {
  readonly links: LandingLinks;
  readonly navigator: Navigator;
}

/** The whole page, assembled from injected links and navigator. */
export function LandingPage({ links, navigator }: LandingPageProps): ReactElement {
  return (
    <>
      <NavBar links={links} />
      <main>
        <Hero links={links} navigator={navigator} />
        <BeforeAfter />
        <HowItWorks />
        <Features />
        <SupportedSites />
        <FinalCta links={links} />
      </main>
      <SiteFooter links={links} />
    </>
  );
}
