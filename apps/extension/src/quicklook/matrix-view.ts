import {
  buildComparisonMatrix,
  type ComparisonCell,
  type ComparisonMatrix,
  type ProductSnapshot,
} from "@ezshop/catalog";
import { Dom } from "../popup/dom.ts";
import type { OverlayActions } from "./overlay-actions.ts";
import { thisPageColumn, type QuickLookModel } from "./quicklook-model.ts";

const MISSING_VALUE = "—";

function thumbnail(dom: Dom, snapshot: ProductSnapshot): HTMLElement {
  const imageUrl = snapshot.images[0];
  if (imageUrl === undefined) return dom.el("span", { className: "thumb thumb-empty" });
  return dom.el("img", { className: "thumb", attrs: { src: imageUrl, alt: "", referrerpolicy: "no-referrer" } });
}

function columnHead(dom: Dom, snapshot: ProductSnapshot, rating: ComparisonCell, extra: readonly Node[]): HTMLElement {
  return dom.el("div", { className: "head", attrs: { role: "columnheader" } }, [
    thumbnail(dom, snapshot),
    dom.el("p", { className: "head-name", text: snapshot.title, attrs: { title: snapshot.title } }),
    dom.el("p", { className: "head-rating", text: rating.text ?? MISSING_VALUE }),
    ...extra,
  ]);
}

function removeButton(dom: Dom, productId: string, title: string, actions: OverlayActions): HTMLElement {
  const button = dom.el(
    "button",
    {
      className: "remove",
      attrs: { type: "button", "aria-label": `Remove ${title}`, "data-focus": `remove-${productId}` },
    },
    [dom.icon("close", "icon-remove")],
  );
  button.addEventListener("click", () => actions.removeProduct(productId));
  return button;
}

function addButton(dom: Dom, busy: boolean, actions: OverlayActions): HTMLElement {
  const button = dom.el("button", { className: "add", attrs: { type: "button", "data-focus": "add-page" } }, [
    dom.icon("plus", "icon-add"),
    "Add",
  ]);
  button.disabled = busy;
  button.addEventListener("click", () => actions.addPage());
  return button;
}

function pageHead(
  dom: Dom,
  page: ProductSnapshot,
  rating: ComparisonCell,
  model: QuickLookModel,
  actions: OverlayActions,
): HTMLElement {
  const pill = dom.el("span", { className: "page-pill", text: "This page" });
  const head = columnHead(dom, page, rating, [addButton(dom, model.busy, actions)]);
  head.classList.add("is-page");
  head.prepend(pill);
  return head;
}

function valueCell(dom: Dom, cell: ComparisonCell, isPage: boolean, pillText: string): HTMLElement {
  const classes = [
    "cell",
    cell.text === null ? "cell-none" : "",
    cell.isBest ? "cell-best" : "",
    isPage ? "is-page" : "",
  ];
  const node = dom.el("div", { className: classes.filter(Boolean).join(" "), attrs: { role: "cell" } }, [
    cell.text ?? MISSING_VALUE,
  ]);
  // Text pill, never colour alone: green-soft marks the winner but the word carries the meaning.
  if (cell.isBest) node.append(dom.el("span", { className: "pill", text: pillText }));
  return node;
}

function dataRow(
  dom: Dom,
  label: string,
  cells: readonly ComparisonCell[],
  hasPage: boolean,
  pillText: string,
): HTMLElement {
  const lastIndex = cells.length - 1;
  return dom.el("div", { className: "row", attrs: { role: "row" } }, [
    dom.el("div", { className: "label", text: label, attrs: { role: "rowheader" } }),
    ...cells.map((cell, index) => valueCell(dom, cell, hasPage && index === lastIndex, pillText)),
  ]);
}

function groupTitle(dom: Dom, title: string): HTMLElement {
  return dom.el("div", { className: "group-title", text: title, attrs: { role: "row" } });
}

/**
 * The comparison matrix: a head row (saved products, then the highlighted "This page" column), the price
 * row, then spec groups from buildComparisonMatrix, and an "N identical specs hidden" line.
 *
 * @example matrixView(dom, model, actions)
 */
export function matrixView(dom: Dom, model: QuickLookModel, actions: OverlayActions): HTMLElement {
  const saved = model.state?.products ?? [];
  const page = thisPageColumn(model);
  const snapshots = [...saved.map((product) => product.snapshot), ...(page === null ? [] : [page])];
  const matrix = buildComparisonMatrix(snapshots, { differencesOnly: model.differencesOnly });
  const root = dom.el("div", { className: "matrix", attrs: { role: "table", "aria-label": "Product comparison" } });
  root.style.setProperty("--columns", String(snapshots.length));
  root.append(headRow(dom, model, matrix.ratings, actions), ...bodyRows(dom, matrix, page !== null));
  return root;
}

function headRow(
  dom: Dom,
  model: QuickLookModel,
  ratings: readonly ComparisonCell[],
  actions: OverlayActions,
): HTMLElement {
  const saved = model.state?.products ?? [];
  const page = thisPageColumn(model);
  const ratingAt = (index: number): ComparisonCell => ratings[index] ?? { text: null, isBest: false };
  const heads = saved.map((product, index) =>
    columnHead(dom, product.snapshot, ratingAt(index), [
      removeButton(dom, product.id, product.snapshot.title, actions),
    ]),
  );
  if (page !== null) heads.push(pageHead(dom, page, ratingAt(saved.length), model, actions));
  const note = dom.el("div", { className: "label label-note", text: "Lowest price and best values are labelled" });
  return dom.el("div", { className: "row head-row", attrs: { role: "row" } }, [note, ...heads]);
}

function bodyRows(dom: Dom, matrix: ComparisonMatrix, hasPage: boolean): HTMLElement[] {
  const rows = [groupTitle(dom, "Price"), dataRow(dom, "Price", matrix.prices, hasPage, "Lowest")];
  for (const group of matrix.groups) {
    rows.push(
      groupTitle(dom, group.title),
      ...group.rows.map((row) => dataRow(dom, row.label, row.cells, hasPage, "Best")),
    );
  }
  if (matrix.identicalCount > 0) rows.push(identicalLine(dom, matrix.identicalCount));
  return rows;
}

function identicalLine(dom: Dom, count: number): HTMLElement {
  const noun = count === 1 ? "spec" : "specs";
  return dom.el("p", { className: "identical-note", text: `${count} identical ${noun} hidden` });
}
