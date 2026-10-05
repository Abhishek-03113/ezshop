import { Outlet } from "@tanstack/react-router";

/** Page shell: each routed page brings its own app bar, because the bar differs per screen. */
export function AppLayout() {
  return (
    <div className="app">
      <Outlet />
    </div>
  );
}
