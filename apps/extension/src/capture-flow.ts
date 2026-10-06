import { isSupportedProductUrl } from "@picky/catalog";
import type { BrowserPort } from "./browser-port.ts";
import type { CaptureConfig } from "./capture-config.ts";
import { summarizeSnapshot, type CaptureOutcome, type CapturePhase, type SavedSummary } from "./capture-outcome.ts";
import type { CaptureResult } from "./capture-result.ts";

export interface CaptureFlowDependencies {
  browser: BrowserPort;
  config: CaptureConfig;
  sendSnapshot: (snapshot: Extract<CaptureResult, { ok: true }>["snapshot"]) => Promise<string>;
  /** The "Open sheet automatically" preference, read fresh for every capture. */
  settings: { isAutoOpenEnabled(): Promise<boolean> };
  log: (event: string, fields: Record<string, string | number>) => void;
}

export interface ActiveTab {
  id: number;
  url: string;
}

export type ProgressListener = (phase: CapturePhase) => void;

/**
 * Popup opened → capture the page → send to the API → (when "Open sheet automatically" is on)
 * open its Picky spec sheet. Every outcome ends in a badge, so the user always sees whether it worked.
 *
 * @example const outcome = await runCaptureFlow({ id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" }, deps)
 */
export async function runCaptureFlow(
  tab: ActiveTab,
  deps: CaptureFlowDependencies,
  onProgress: ProgressListener = () => {},
): Promise<CaptureOutcome> {
  if (!isSupportedProductUrl(tab.url)) {
    deps.log("capture.unsupported", { tabId: tab.id, url: tab.url });
    await deps.browser.showBadge(tab.id, "unsupported");
    return { kind: "unsupported" };
  }
  await deps.browser.showBadge(tab.id, "working");
  try {
    const summary = await captureAndSend(tab, deps, onProgress);
    await openSheetWhenWanted(summary.productId, deps);
    await deps.browser.showBadge(tab.id, "done");
    return { kind: "saved", summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.log("capture.failed", { tabId: tab.id, url: tab.url, message });
    await deps.browser.showBadge(tab.id, "failed");
    return { kind: "failed", message };
  }
}

async function openSheetWhenWanted(productId: string, deps: CaptureFlowDependencies): Promise<void> {
  if (!(await deps.settings.isAutoOpenEnabled())) return;
  await deps.browser.openTab(`${deps.config.webBaseUrl}/products/${productId}`);
}

async function captureAndSend(
  tab: ActiveTab,
  deps: CaptureFlowDependencies,
  onProgress: ProgressListener,
): Promise<SavedSummary> {
  onProgress("reading");
  const result = await deps.browser.capturePageInTab(tab.id);
  if (!result.ok) throw new Error(result.message);
  onProgress("saving");
  const productId = await deps.sendSnapshot(result.snapshot);
  deps.log("capture.sent", { tabId: tab.id, externalId: result.snapshot.externalId, productId });
  return summarizeSnapshot(productId, result.snapshot);
}
