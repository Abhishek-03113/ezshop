import { Link } from "@tanstack/react-router";
import { AppBar, BrandLink, MainNav } from "../components/app-bar.tsx";
import { ComparisonSidebar } from "../components/comparison-sidebar.tsx";

/** /comparisons when nothing is saved yet (otherwise the route redirects to the latest comparison). */
export function ComparisonsIndexPage() {
  return (
    <>
      <AppBar sticky>
        <BrandLink />
        <MainNav />
      </AppBar>
      <div className="compare-layout">
        <ComparisonSidebar comparisons={[]} />
        <main className="compare-main">
          <h1 className="page-title">Comparisons</h1>
          <div className="card empty-state">
            <strong>No comparisons yet</strong>
            <p className="subtle">
              Pick products in your library and press “Compare”, or start an empty comparison with “New comparison”.
            </p>
            <Link to="/" className="soft-button">
              Open library
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
