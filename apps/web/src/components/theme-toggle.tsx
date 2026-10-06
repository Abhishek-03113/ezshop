import { useState } from "react";
import { applyTheme, readTheme, type Theme } from "@picky/ui-tokens/theme.ts";
import { BulbIcon } from "./icons.tsx";

/** Bulb button for the top right corner: lit in light mode, unlit in dark mode. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === "undefined" ? "light" : readTheme(document.documentElement),
  );
  const next: Theme = theme === "light" ? "dark" : "light";
  const toggle = () => {
    applyTheme(document.documentElement, next);
    setTheme(next);
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <BulbIcon lit={theme === "light"} />
    </button>
  );
}
