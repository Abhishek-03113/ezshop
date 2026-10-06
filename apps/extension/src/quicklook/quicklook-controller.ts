import type { ProductSnapshot } from "@ezshop/catalog";
import type { QuickLookState } from "../messaging/messages.ts";
import { Dom } from "../popup/dom.ts";
import { focusableControls, nextFocusTarget } from "./focus-trap.ts";
import type { OverlayActions } from "./overlay-actions.ts";
import { overlayView } from "./overlay-view.ts";
import type { QuickLookApi } from "./quicklook-api.ts";
import {
  INITIAL_MODEL,
  effectiveView,
  neighbourComparisonId,
  showsSpecs,
  type QuickLookModel,
  type QuickLookView,
} from "./quicklook-model.ts";

export interface QuickLookControllerDependencies {
  /** Mount point inside the closed shadow root; also where focus is trapped. */
  container: HTMLElement;
  /** Reads the live tab, or returns null when it is not a product page. */
  readPage: () => ProductSnapshot | null;
  api: QuickLookApi;
  /** Asks the host to remove the overlay. */
  onClose: () => void;
  /** The element focused inside the shadow root (closed roots hide it from outside, so the host passes it). */
  activeElement: () => Element | null;
}

// INPUT: the spec search box owns Return and the arrow keys for its own caret, so they are not shortcuts there.
const CONTROL_KEYS_IGNORED_ON: ReadonlySet<string> = new Set(["BUTTON", "A", "SELECT", "INPUT"]);
const ARROW_KEYS_IGNORED_ON: ReadonlySet<string> = new Set(["SELECT", "INPUT"]);

/**
 * Owns the Quick Look model: loads it through the API, renders it, and turns clicks and keys into actions.
 *
 * @example const controller = new QuickLookController(deps); await controller.open()
 */
export class QuickLookController implements OverlayActions {
  private model: QuickLookModel = INITIAL_MODEL;
  private readonly dom: Dom;

  constructor(private readonly deps: QuickLookControllerDependencies) {
    this.dom = new Dom(deps.container.ownerDocument);
  }

  /**
   * Loads the model and renders it on `view` (specs by default; compare when the page is not a product).
   *
   * @example await controller.open("compare")
   */
  async open(view: QuickLookView = "specs"): Promise<void> {
    this.model = { ...INITIAL_MODEL, view, pageSnapshot: this.deps.readPage() };
    this.render();
    await this.load(() => this.deps.api.init());
  }

  close(): void {
    this.deps.onClose();
  }

  retry(): void {
    this.model = { ...this.model, status: "loading", message: null };
    this.render();
    void this.load(() => this.deps.api.init());
  }

  select(comparisonId: string): void {
    void this.load(() => this.deps.api.select(comparisonId));
  }

  addPage(): void {
    const page = this.model.pageSnapshot;
    if (page === null) return;
    void this.load(() => this.deps.api.add(this.model.state?.selectedId ?? null, page));
  }

  removeProduct(productId: string): void {
    const selectedId = this.model.state?.selectedId;
    if (selectedId === undefined || selectedId === null) return;
    void this.load(() => this.deps.api.remove(selectedId, productId));
  }

  setDifferencesOnly(differencesOnly: boolean): void {
    this.model = { ...this.model, differencesOnly };
    this.render();
  }

  /**
   * Switches between the comparison matrix and this page's spec sheet. Asking for "specs" on a page
   * with no snapshot is ignored: there is nothing to show.
   *
   * @example controller.setView("specs") // no-op on a search page
   */
  setView(view: QuickLookView): void {
    if (view === "specs" && this.model.pageSnapshot === null) return;
    this.model = { ...this.model, view };
    this.render({ keepScroll: false });
  }

  /** The view on screen, after the no-page fallback; the host compares it with the requested view to toggle. */
  currentView(): QuickLookView {
    return effectiveView(this.model);
  }

  /** Returns true when the key was ours, so the host can stop the page from seeing it. */
  handleKey(event: Pick<KeyboardEvent, "key" | "shiftKey">): boolean {
    const active = this.deps.activeElement();
    if (event.key === "Escape") return this.run(() => this.close());
    if (event.key === "Tab") return this.trapTab(active, event.shiftKey);
    // The compare shortcuts act on controls the specs view hides, so they must not fire blind there.
    if (showsSpecs(this.model)) return false;
    const tag = active?.tagName ?? "";
    if (event.key === "Enter" && !CONTROL_KEYS_IGNORED_ON.has(tag)) return this.run(() => this.addPage());
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !ARROW_KEYS_IGNORED_ON.has(tag))
      return this.switchBy(event.key === "ArrowRight" ? 1 : -1);
    return false;
  }

  private run(action: () => void): boolean {
    action();
    return true;
  }

  private switchBy(step: 1 | -1): boolean {
    const state = this.model.state;
    const next = state === null ? null : neighbourComparisonId(state, step);
    if (next === null) return false;
    this.select(next);
    return true;
  }

  private trapTab(active: Element | null, backwards: boolean): boolean {
    const target = nextFocusTarget(focusableControls(this.deps.container), active, backwards);
    target?.focus();
    return target !== null;
  }

  private async load(request: () => Promise<QuickLookState>): Promise<void> {
    this.model = { ...this.model, busy: true, message: null };
    this.render();
    try {
      this.model = { ...this.model, status: "ready", state: await request(), busy: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.model = { ...this.model, status: this.model.state === null ? "failed" : "ready", message, busy: false };
    }
    this.render();
  }

  /** `keepScroll: false` for a view switch: the other view's scroll offset means nothing here. */
  private render({ keepScroll }: { keepScroll: boolean } = { keepScroll: true }): void {
    const { container } = this.deps;
    const focusId = this.deps.activeElement()?.getAttribute("data-focus") ?? null;
    const scrollTop = keepScroll ? (container.querySelector(".body")?.scrollTop ?? 0) : 0;
    container.replaceChildren(overlayView(this.dom, this.model, this));
    const body = container.querySelector(".body");
    if (body !== null) body.scrollTop = scrollTop;
    this.focusControl(focusId ?? "dialog");
  }

  private focusControl(focusId: string): void {
    const target = this.deps.container.querySelector<HTMLElement>(`[data-focus="${focusId}"]`);
    (target ?? this.deps.container.querySelector<HTMLElement>("[data-focus]"))?.focus();
  }
}
