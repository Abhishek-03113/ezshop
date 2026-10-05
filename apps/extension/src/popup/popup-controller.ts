import type { ActiveTab } from "../capture-flow.ts";
import type { SettingsStore } from "../settings.ts";
import type { ActiveTabSource } from "./active-tab-source.ts";
import type { CaptureService } from "./capture-service.ts";
import { Dom } from "./dom.ts";
import { stateFromOutcome, type PopupState } from "./popup-state.ts";
import { renderPopupView } from "./popup-view.ts";

export interface PopupDependencies {
  root: HTMLElement;
  settings: SettingsStore;
  tabs: ActiveTabSource;
  captureService: CaptureService;
  webBaseUrl: string;
}

/** "www.amazon.in" → "amazon.in"; null for anything that is not a parseable URL. */
export function hostLabelOf(url: string): string | null {
  const parsed = URL.parse(url);
  return parsed === null ? null : parsed.hostname.replace(/^www\./, "");
}

/**
 * Drives the popup: first run shows the welcome board, every later open starts the capture
 * of the active tab at once. "Got it" dismisses the welcome and captures.
 *
 * @example await new PopupController(dependencies).start()
 */
export class PopupController {
  private readonly dom: Dom;
  private autoOpen = true;
  private hostLabel: string | null = null;

  constructor(private readonly deps: PopupDependencies) {
    this.dom = new Dom(deps.root.ownerDocument);
  }

  async start(): Promise<void> {
    const settings = await this.deps.settings.load();
    this.autoOpen = settings.autoOpenSheet;
    if (settings.firstRunDismissed) return this.capture();
    this.show({ kind: "welcome" });
  }

  async capture(): Promise<void> {
    const tab = await this.deps.tabs.getActiveTab();
    if (tab === null) return this.show({ kind: "unsupported" });
    this.hostLabel = hostLabelOf(tab.url);
    this.show({ kind: "capturing", phase: "reading" });
    this.show(await this.runCapture(tab));
  }

  private async runCapture(tab: ActiveTab): Promise<PopupState> {
    try {
      const outcome = await this.deps.captureService.capture(tab, (phase) => this.show({ kind: "capturing", phase }));
      return stateFromOutcome(outcome);
    } catch (error) {
      return { kind: "failed", message: error instanceof Error ? error.message : String(error) };
    }
  }

  private show(state: PopupState): void {
    const view = renderPopupView(this.dom, state, {
      webBaseUrl: this.deps.webBaseUrl,
      hostLabel: this.hostLabel,
      autoOpen: this.autoOpen,
      onDismissWelcome: () => void this.dismissWelcome(),
      onRetry: () => void this.capture(),
      onAutoOpenChange: (checked) => void this.saveAutoOpen(checked),
    });
    this.deps.root.replaceChildren(view);
  }

  private async dismissWelcome(): Promise<void> {
    await this.deps.settings.dismissFirstRun();
    await this.capture();
  }

  private async saveAutoOpen(checked: boolean): Promise<void> {
    this.autoOpen = checked;
    await this.deps.settings.setAutoOpenSheet(checked);
  }
}
