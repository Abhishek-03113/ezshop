import { Link, type ErrorComponentProps } from "@tanstack/react-router";

/** Shown when a route loader fails: the API's message plus a way back. */
export function RouteErrorPanel({ error }: ErrorComponentProps) {
  return (
    <div className="panel error-panel" role="alert">
      <h2>Couldn't load this page</h2>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <Link to="/">Back to products</Link>
    </div>
  );
}
