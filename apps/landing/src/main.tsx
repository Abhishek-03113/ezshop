import "@picky/ui-tokens/tokens.css";
import "./styles/base.css";
import "./styles/sections.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingPage } from "./components/landing-page.tsx";
import { buildLandingLinks } from "./lib/links.ts";
import type { Navigator } from "./lib/product-link.ts";

// The only place that touches window.location, so everything else stays testable.
const browserNavigator: Navigator = { navigate: (url) => window.location.assign(url) };
const links = buildLandingLinks({
  VITE_PICKY_WEB_URL: import.meta.env.VITE_PICKY_WEB_URL,
  VITE_PICKY_EXTENSION_URL: import.meta.env.VITE_PICKY_EXTENSION_URL,
});
const root = document.getElementById("root");
if (!root) throw new Error('Missing <div id="root">; index.html must provide the mount point.');

createRoot(root).render(
  <StrictMode>
    <LandingPage links={links} navigator={browserNavigator} />
  </StrictMode>,
);
