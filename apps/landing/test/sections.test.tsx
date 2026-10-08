import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CreditFooter } from "../src/components/credit-footer.tsx";
import { BeforeAfter } from "../src/components/before-after.tsx";
import { ComparePreview } from "../src/components/compare-preview.tsx";
import { FinalCta } from "../src/components/final-cta.tsx";
import { Features } from "../src/components/features.tsx";
import { Hero } from "../src/components/hero.tsx";
import { HowItWorks } from "../src/components/how-it-works.tsx";
import { LandingPage } from "../src/components/landing-page.tsx";
import { NavBar } from "../src/components/nav-bar.tsx";
import { PasteLinkForm } from "../src/components/paste-link-form.tsx";
import { SiteFooter } from "../src/components/site-footer.tsx";
import { SupportedSites } from "../src/components/supported-sites.tsx";
import type { LandingLinks } from "../src/lib/links.ts";
import { FakeNavigator } from "./fakes/fake-navigator.ts";

const links: LandingLinks = { webUrl: "http://app.test", extensionUrl: "https://store.test/ext" };
const render = renderToStaticMarkup;

describe("NavBar", () => {
  test("shows the logo and links to app root and the extension", () => {
    const html = render(<NavBar links={links} />);
    expect(html).toContain('src="/logo-128.png"');
    expect(html).toContain('href="http://app.test/"');
    expect(html).toContain('href="https://store.test/ext"');
    expect(html).toContain("How it works");
  });
});

describe("Hero", () => {
  test("renders headline, both calls to action and the form", () => {
    const html = render(<Hero links={links} navigator={new FakeNavigator()} />);
    expect(html).toContain("Stop shopping by opening more tabs.");
    expect(html).toContain("/mascot.png");
    expect(html).toContain('href="#sample"');
    expect(html).toContain("<form");
  });
});

describe("PasteLinkForm", () => {
  test("has a labelled input and starts without an error", () => {
    const html = render(<PasteLinkForm webUrl={links.webUrl} navigator={new FakeNavigator()} />);
    expect(html).toContain('<label class="visually-hidden" for="paste-url">Product link</label>');
    expect(html).not.toContain('role="alert"');
  });
});

describe("BeforeAfter", () => {
  test("shows the sample anchor and Sony data", () => {
    const html = render(<BeforeAfter />);
    expect(html).toContain('id="sample"');
    expect(html).toContain("Sony WH-1000XM5");
    expect(html).toContain("₹28,926");
    expect(html).toContain("54 specs in 10 groups");
  });
});

describe("HowItWorks", () => {
  test("lists save, understand, compare and decide with the keyboard shortcut", () => {
    const html = render(<HowItWorks />);
    for (const step of ["Save", "Understand", "Compare", "Decide"]) expect(html).toContain(`<h3>${step}</h3>`);
    expect(html).toContain("<kbd>Alt</kbd>");
  });
});

describe("ComparePreview", () => {
  test("marks clear winners and leaves preference rows unmarked", () => {
    const html = render(<ComparePreview />);
    expect(html.match(/Better/g)).toHaveLength(3);
    expect(html).toContain("Same on both");
    expect(html).toContain("Sample data");
  });
});

describe("Features", () => {
  test("renders the four principles", () => {
    const html = render(<Features />);
    expect(html.match(/<dt>/g)).toHaveLength(4);
    expect(html).toContain("Neutral");
  });
});

describe("SupportedSites", () => {
  test("lists Amazon.in and Flipkart", () => {
    const html = render(<SupportedSites />);
    expect(html).toContain("Amazon.in");
    expect(html).toContain("Flipkart");
  });
});

describe("FinalCta and SiteFooter", () => {
  test("render closing copy and disclaimer", () => {
    expect(render(<FinalCta links={links} />)).toContain("Decide with confidence.");
    expect(render(<SiteFooter links={links} />)).toContain("not affiliated with Amazon or Flipkart");
  });
});

describe("LandingPage", () => {
  test("has header, main and footer landmarks", () => {
    const html = render(<LandingPage links={links} navigator={new FakeNavigator()} />);
    expect(html).toContain("<header");
    expect(html).toContain("<main>");
    expect(html).toContain("<footer");
  });
});

describe("CreditFooter", () => {
  test("shows the year and links to the portfolio and GitHub", () => {
    const html = renderToStaticMarkup(<CreditFooter year={2026} />);
    expect(html).toContain("2026");
    expect(html).toContain('href="https://abhishek-3113.vercel.app/"');
    expect(html).toContain(">AP3X</a>");
    expect(html).toContain('href="https://github.com/Abhishek-03113"');
  });
});
