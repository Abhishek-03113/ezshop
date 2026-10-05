import { Dom } from "../popup/dom.ts";
import type { QuickLookModel } from "./quicklook-model.ts";

function hint(dom: Dom, keys: readonly string[], text: string): HTMLElement {
  return dom.el("span", { className: "hint" }, [
    ...keys.flatMap((key) => [dom.el("kbd", { className: "kbd", text: key }), " "]),
    text,
  ]);
}

/**
 * Footer: keyboard hints and the "Open in ezshop" link to the web compare page.
 *
 * @example footerView(dom, model) // link: http://localhost:5173/comparisons/<id>
 */
export function footerView(dom: Dom, model: QuickLookModel): HTMLElement {
  const state = model.state;
  const hints = [
    hint(dom, ["Esc"], "close"),
    hint(dom, ["Return"], "add this page"),
    hint(dom, ["←", "→"], "switch comparison"),
  ];
  if (state?.selectedId === null || state === null) return dom.el("footer", { className: "footer" }, hints);
  const href = `${state.webBaseUrl}/comparisons/${encodeURIComponent(state.selectedId)}`;
  const link = dom.el("a", {
    className: "open-link",
    text: "Open in ezshop ↗",
    attrs: { href, target: "_blank", rel: "noopener" },
  });
  return dom.el("footer", { className: "footer" }, [...hints, link]);
}
