import { Dom } from "../popup/dom.ts";
import { showsSpecs, type QuickLookModel } from "./quicklook-model.ts";

function hint(dom: Dom, keys: readonly string[], text: string): HTMLElement {
  return dom.el("span", { className: "hint" }, [
    ...keys.flatMap((key) => [dom.el("kbd", { className: "kbd", text: key }), " "]),
    text,
  ]);
}

/**
 * Footer: keyboard hints and the "Open in Picky" link to the web compare page. The specs view is a
 * read-only look at this page, so it keeps only the Esc hint and the shortcut to the comparison: Return,
 * the arrows and the comparison link all act on the comparison, which that view does not show. The
 * compare view ends its hints with the shortcut back to specs.
 *
 * @example footerView(dom, model) // link: http://localhost:5173/comparisons/<id>
 */
export function footerView(dom: Dom, model: QuickLookModel): HTMLElement {
  if (showsSpecs(model))
    return dom.el("footer", { className: "footer" }, [
      hint(dom, ["Esc"], "close"),
      hint(dom, ["Alt+Shift+V"], "compare"),
    ]);
  const state = model.state;
  const hints = [
    hint(dom, ["Esc"], "close"),
    hint(dom, ["Return"], "add this page"),
    hint(dom, ["←", "→"], "switch comparison"),
    hint(dom, ["Alt+Shift+S"], "specs"),
  ];
  if (state?.selectedId === null || state === null) return dom.el("footer", { className: "footer" }, hints);
  const href = `${state.webBaseUrl}/comparisons/${encodeURIComponent(state.selectedId)}`;
  const link = dom.el("a", {
    className: "open-link",
    text: "Open in Picky ↗",
    attrs: { href, target: "_blank", rel: "noopener" },
  });
  return dom.el("footer", { className: "footer" }, [...hints, link]);
}
