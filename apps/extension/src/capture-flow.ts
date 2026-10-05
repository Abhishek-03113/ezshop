import { isSupportedProductUrl } from "@ezshop/catalog";
import type { BrowserPort } from "./browser-port.ts";
import type { CaptureConfig } from "./capture-config.ts";
import type { CaptureResult } from "./capture-result.ts";

export interface CaptureFlowDependencies {
  browser: BrowserPort;
  config: CaptureConfig;
  sendSnapshot: (snapshot: Extract<CaptureResult, { ok: true }>["snapshot"]) => Promise<string>;
  log: (event: string, fields: Record<string, string | number>) => void;
}

export interface ActiveTab {
  id: number;
  url: string;
}

/**
 * Toolbar click → capture the page → send to the API → open its ezshop spec sheet.
 * Every outcome ends in a badge, so the user always sees whether it worked.
 *
 * @example await runCaptureFlow({ id: 7, url: "https://www.amazon.in/dp/B0FQG1YHYR" }, deps)
 */
export async function runCaptureFlow(tab: ActiveTab, deps: CaptureFlowDependencies): Promise<void> {
  if (!isSupportedProductUrl(tab.url)) {
    deps.log("capture.unsupported", { tabId: tab.id, url: tab.url });
    return deps.browser.showBadge(tab.id, "unsupported");
  }
  await deps.browser.showBadge(tab.id, "working");
  try {
    const productId = await captureAndSend(tab, deps);
    await deps.browser.openTab(`${deps.config.webBaseUrl}/products/${productId}`);
    await deps.browser.showBadge(tab.id, "done");
  } catch (error) {
    deps.log("capture.failed", {
      tabId: tab.id,
      url: tab.url,
      message: error instanceof Error ? error.message : String(error),
    });
    await deps.browser.showBadge(tab.id, "failed");
  }
}

async function captureAndSend(tab: ActiveTab, deps: CaptureFlowDependencies): Promise<string> {
  const result = await deps.browser.capturePageInTab(tab.id);
  if (!result.ok) throw new Error(result.message);
  const productId = await deps.sendSnapshot(result.snapshot);
  deps.log("capture.sent", { tabId: tab.id, externalId: result.snapshot.externalId, productId });
  return productId;
}
