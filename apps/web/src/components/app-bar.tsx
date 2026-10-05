import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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

/** Frosted top bar; each page decides what goes inside it. */
export function AppBar({ children, sticky = false }: { children: ReactNode; sticky?: boolean }) {
  return (
    <header className={sticky ? "app-bar sticky" : "app-bar"}>
      <div className="app-bar-inner">{children}</div>
    </header>
  );
}
