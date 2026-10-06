export type Theme = "light" | "dark";

const STORAGE_KEY = "picky-theme";

/**
 * Inline script for each app's index.html <head>: applies a saved dark choice before first paint so
 * the page never flashes light. Keep in step with `readTheme`.
 */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${STORAGE_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

/**
 * The theme currently applied to the document. Light is the default.
 *
 * @example readTheme(document.documentElement) // "light"
 */
export function readTheme(root: HTMLElement): Theme {
  return root.dataset["theme"] === "dark" ? "dark" : "light";
}

/**
 * Applies and remembers a theme. Storage can be blocked (private mode), in which case the choice
 * only lasts for this page view.
 *
 * @example applyTheme(document.documentElement, "dark")
 */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  root.dataset["theme"] = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not persisted; the page itself is already themed.
  }
}
