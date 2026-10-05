import { Link, Outlet } from "@tanstack/react-router";

/** Page chrome: brand bar and the routed page below it. */
export function AppLayout() {
  return (
    <div className="app">
      <header className="app-bar">
        <Link to="/" className="brand">
          ez<span>shop</span>
        </Link>
        <p className="brand-tagline">Specs first. Everything else later.</p>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
