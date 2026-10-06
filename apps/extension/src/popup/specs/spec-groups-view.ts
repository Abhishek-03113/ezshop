import { specGroupAnchor, type SpecGroup } from "@picky/catalog";
import type { Dom } from "../dom.ts";
import { GroupHighlighter } from "./group-highlight.ts";

/**
 * Chips that jump to each visible group, with its spec count. The popup body is the scroll
 * container, so a chip scrolls its section into view instead of changing the URL hash.
 * An empty list renders nothing (null) so the caller can leave the slot blank.
 *
 * @example slot.replaceChildren(...[renderGroupChips(dom, groups)].filter((node) => node !== null))
 */
export function renderGroupChips(dom: Dom, groups: readonly SpecGroup[]): HTMLElement | null {
  if (groups.length === 0) return null;
  const highlighter = new GroupHighlighter();
  const chips = groups.map((group) => renderChip(dom, group, highlighter));
  return dom.el("nav", { className: "group-chips", attrs: { "aria-label": "Spec groups" } }, chips);
}

function renderChip(dom: Dom, group: SpecGroup, highlighter: GroupHighlighter): HTMLElement {
  const chip = dom.el("button", { attrs: { type: "button" } }, [
    `${group.title} `,
    dom.el("span", { className: "count", text: String(group.specs.length) }),
  ]);
  chip.addEventListener("click", () => {
    const section = findInRoot(chip, specGroupAnchor(group.title));
    if (section === null) return;
    clearStickyBar(chip, section);
    section.scrollIntoView({ block: "start", behavior: scrollBehavior(chip) });
    highlighter.show(chip, section);
  });
  return chip;
}

const STICKY_GAP_PX = 8;

/**
 * Makes the jump land the group below the sticky search + chips bar, not under it. The bar's height
 * changes with the width (chips wrap to a second row in the wide Quick Look card), so a fixed CSS
 * offset hid the group's title; measuring at click time is always right.
 *
 * @example clearStickyBar(chip, section) // section.style.scrollMarginTop === "148px" for a 140px bar
 */
function clearStickyBar(chip: HTMLElement, section: HTMLElement): void {
  const barHeight = chip.closest<HTMLElement>(".spec-sheet-tools")?.offsetHeight ?? 0;
  if (barHeight > 0) section.style.scrollMarginTop = `${barHeight + STICKY_GAP_PX}px`;
}

/** Smooth unless the user asked for reduced motion; read from the chip's own window (works in any document). */
function scrollBehavior(node: Node): ScrollBehavior {
  const view = node.ownerDocument?.defaultView;
  return view?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/**
 * Looks an id up in the root the node lives in. Quick Look renders inside a closed shadow root that
 * document.getElementById cannot see into, so chips there scrolled nowhere.
 *
 * @example findInRoot(chip, "group-item-details") // the section in the same document or shadow root
 */
export function findInRoot(node: Node, id: string): HTMLElement | null {
  const root = node.getRootNode() as Document | ShadowRoot;
  return typeof root.getElementById === "function" ? (root.getElementById(id) as HTMLElement | null) : null;
}

/**
 * Every group as a card: title plus a label/value description list.
 *
 * @example container.append(renderGroupSections(dom, snapshot.specGroups))
 */
export function renderGroupSections(dom: Dom, groups: readonly SpecGroup[]): HTMLElement {
  return dom.el(
    "div",
    { className: "spec-groups" },
    groups.map((group) => renderGroup(dom, group)),
  );
}

function renderGroup(dom: Dom, group: SpecGroup): HTMLElement {
  const rows = group.specs.map((spec) =>
    dom.el("div", { className: "spec-row" }, [dom.el("dt", { text: spec.label }), dom.el("dd", { text: spec.value })]),
  );
  return dom.el("section", { className: "spec-card spec-group", attrs: { id: specGroupAnchor(group.title) } }, [
    dom.el("h3", { text: group.title }),
    dom.el("dl", {}, rows),
  ]);
}

/**
 * Empty state for a search that matched nothing, with a button to start over.
 *
 * @example renderNoMatches(dom, " zzz ", () => clearSearch()) // "No specs match “zzz”"
 */
export function renderNoMatches(dom: Dom, query: string, onClear: () => void): HTMLElement {
  const clear = dom.el("button", { className: "soft-button", attrs: { type: "button" }, text: "Clear search" });
  clear.addEventListener("click", onClear);
  return dom.el("div", { className: "spec-card empty-state" }, [
    dom.el("strong", { text: `No specs match “${query.trim()}”` }),
    clear,
  ]);
}
