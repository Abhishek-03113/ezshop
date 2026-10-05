import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { comparisonListQuery } from "../api/comparison-queries.ts";
import { LogoMark } from "./icons.tsx";

/** Logo mark plus wordmark, linking home. */
export function BrandLink() {
  return (
    <Link to="/" className="brand">
      <LogoMark />
      <span className="brand-name">ezshop</span>
    </Link>
  );
}

const rootRouteApi = getRouteApi("__root__");

/** Library and Comparisons links; Comparisons carries the number of saved comparisons. */
export function MainNav() {
  const { comparisonsClient } = rootRouteApi.useRouteContext();
  const { data: comparisons } = useSuspenseQuery(comparisonListQuery(comparisonsClient));
  return (
    <nav aria-label="Main" className="main-nav">
      <Link to="/" className="nav-link" activeOptions={{ exact: true }} activeProps={{ "aria-current": "page" }}>
        Library
      </Link>
      <Link to="/comparisons" className="nav-link" activeProps={{ "aria-current": "page" }}>
        Comparisons
        <span className="nav-count">{comparisons.length}</span>
      </Link>
    </nav>
  );
}

/** Frosted top bar; each page decides what goes inside it. */
export function AppBar({ children, sticky = false }: { children: ReactNode; sticky?: boolean }) {
  return (
    <header className={sticky ? "app-bar sticky" : "app-bar"}>
      <div className="app-bar-inner">{children}</div>
    </header>
  );
}
