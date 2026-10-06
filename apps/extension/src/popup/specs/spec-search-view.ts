import type { Dom } from "../dom.ts";

export interface SpecSearch {
  element: HTMLElement;
  input: HTMLInputElement;
}

/**
 * Live-filtering search field. Fires on every `input` event and never re-renders itself, so the
 * field keeps focus while the results change. Mirrors the web app's SpecSearchBox.
 *
 * @example const { element, input } = renderSpecSearchView(dom, (query) => refilter(query))
 */
export function renderSpecSearchView(dom: Dom, onQueryChange: (query: string) => void): SpecSearch {
  const input = dom.el("input", {
    attrs: {
      id: "spec-search",
      type: "search",
      placeholder: "Find a spec — try “battery”",
      autocomplete: "off",
      "data-focus": "spec-search",
    },
  });
  input.addEventListener("input", () => onQueryChange(input.value));
  const element = dom.el("div", { className: "search-box" }, [
    dom.icon("search", "icon-md"),
    dom.el("label", { className: "visually-hidden", attrs: { for: "spec-search" }, text: "Find a spec" }),
    input,
  ]);
  return { element, input };
}
