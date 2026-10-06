import type { QuickLookTabPort } from "../../src/quicklook/quicklook-launcher.ts";
import type { QuickLookView } from "../../src/quicklook/quicklook-model.ts";

/** Records Quick Look browser calls; `injectionFails` simulates a chrome:// or web-store tab. */
export class FakeQuickLookTabPort implements QuickLookTabPort {
  readonly toggled: number[] = [];
  /** The view each injectAndToggle call asked for, in call order. */
  readonly views: QuickLookView[] = [];
  readonly popups: number[] = [];

  constructor(
    private readonly injectionFails: boolean,
    private readonly popupFails = false,
  ) {}

  async injectAndToggle(tabId: number, view: QuickLookView): Promise<void> {
    if (this.injectionFails) throw new Error("Cannot access a chrome:// URL");
    this.toggled.push(tabId);
    this.views.push(view);
  }

  async openPopupFor(tabId: number): Promise<void> {
    if (this.popupFails) throw new Error("openPopup unavailable");
    this.popups.push(tabId);
  }
}
