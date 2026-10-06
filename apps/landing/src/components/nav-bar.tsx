import type { ReactElement } from "react";
import { appHomeUrl, type LandingLinks } from "../lib/links.ts";
import { LogoMark } from "./icons.tsx";
import { ThemeToggle } from "./theme-toggle.tsx";

/** Sticky translucent top bar. @example <NavBar links={links} /> */
export function NavBar({ links }: { readonly links: LandingLinks }): ReactElement {
  return (
    <header className="nav">
      <nav className="nav-inner" aria-label="Primary">
        <a className="brand" href="#top">
          <LogoMark />
          <span className="brand-name">Picky</span>
        </a>
        <span className="nav-spacer" />
        <a className="nav-link nav-link-section" href="#how">
          How it works
        </a>
        <a className="nav-link nav-link-section" href="#compare">
          Compare
        </a>
        <a className="nav-link" href={appHomeUrl(links)}>
          Open app
        </a>
        <ThemeToggle />
        <a className="pill pill-small" href={links.extensionUrl}>
          Add to Chrome
        </a>
      </nav>
    </header>
  );
}
