import type { Highlight } from "@picky/catalog";
import type { Dom } from "../dom.ts";

/** Popup height budget: more bullets than this are folded behind "Show all". */
export const COLLAPSED_HIGHLIGHT_COUNT = 3;

/**
 * The seller's "About this item" bullets as a card, folded to the first few; nothing when the
 * page had none. Mirrors the web app's HighlightList.
 *
 * @example container.append(...renderSpecHighlightsView(dom, snapshot.highlights))
 */
export function renderSpecHighlightsView(dom: Dom, highlights: readonly Highlight[]): HTMLElement[] {
  if (highlights.length === 0) return [];
  const list = dom.el("ul");
  const toggle = renderToggle(dom);
  const paint = (expanded: boolean): void => {
    list.replaceChildren(...visibleHighlights(highlights, expanded).map((highlight) => renderItem(dom, highlight)));
    toggle.textContent = expanded ? "Show fewer" : `Show all ${highlights.length}`;
    toggle.setAttribute("aria-expanded", String(expanded));
  };
  toggle.addEventListener("click", () => paint(toggle.getAttribute("aria-expanded") !== "true"));
  paint(false);
  return [renderCard(dom, list, highlights.length > COLLAPSED_HIGHLIGHT_COUNT ? toggle : null)];
}

function renderCard(dom: Dom, list: HTMLElement, toggle: HTMLElement | null): HTMLElement {
  const attrs = { "aria-labelledby": "highlights-title" };
  const card = dom.el("section", { className: "spec-card highlights", attrs }, [
    dom.el("h2", { attrs: { id: "highlights-title" }, text: "Highlights" }),
    list,
  ]);
  if (toggle !== null) card.append(toggle);
  return card;
}

function visibleHighlights(highlights: readonly Highlight[], expanded: boolean): readonly Highlight[] {
  return expanded ? highlights : highlights.slice(0, COLLAPSED_HIGHLIGHT_COUNT);
}

function renderToggle(dom: Dom): HTMLButtonElement {
  return dom.el("button", { className: "soft-button", attrs: { type: "button", "aria-expanded": "false" } });
}

function renderItem(dom: Dom, highlight: Highlight): HTMLElement {
  const item = dom.el("li");
  if (highlight.heading !== null) item.append(dom.el("strong", { text: `${highlight.heading} ` }));
  item.append(highlight.text);
  return item;
}
