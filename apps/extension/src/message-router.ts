import type { ExtensionRequest, ExtensionResponse, QuickLookRequest } from "./messaging/messages.ts";
import type { LinkAddJob } from "./link-capture/link-capture-service.ts";
import type { QuickLookService } from "./quicklook/quicklook-service.ts";

export interface RouterDependencies {
  quickLook: Pick<QuickLookService, "init" | "select" | "add" | "remove">;
  linkCapture: { add(job: LinkAddJob): Promise<void>; undo(comparisonId: string, productId: string): Promise<void> };
  /** Opens Quick Look in the tab a toast button was pressed in. */
  openQuickLook: (tabId: number) => Promise<void>;
}

/**
 * Answers runtime messages from our own content scripts. Errors become `{ ok: false, message }`
 * because a rejected promise would reach the sender as an opaque "message port closed".
 *
 * @example const reply = await routeRequest({ type: "quicklook:init" }, { tabId: 7 }, deps)
 */
export async function routeRequest(
  request: ExtensionRequest,
  sender: { tabId: number | null },
  deps: RouterDependencies,
): Promise<ExtensionResponse<unknown>> {
  try {
    return { ok: true, body: await dispatch(request, sender, deps) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function dispatch(
  request: ExtensionRequest,
  sender: { tabId: number | null },
  deps: RouterDependencies,
): Promise<unknown> {
  switch (request.type) {
    case "link:add":
      return Promise.resolve(startLinkAdd(request.url, request.label, sender.tabId, deps));
    case "toast:undo":
      return deps.linkCapture.undo(request.comparisonId, request.productId);
    case "toast:quicklook":
      return sender.tabId === null ? Promise.resolve() : deps.openQuickLook(sender.tabId);
    default:
      return dispatchQuickLook(request, deps.quickLook);
  }
}

function dispatchQuickLook(request: QuickLookRequest, quickLook: RouterDependencies["quickLook"]): Promise<unknown> {
  switch (request.type) {
    case "quicklook:init":
      return quickLook.init();
    case "quicklook:select":
      return quickLook.select(request.comparisonId);
    case "quicklook:add":
      return quickLook.add(request.comparisonId, request.snapshot);
    case "quicklook:remove":
      return quickLook.remove(request.comparisonId, request.productId);
  }
}

/** Replies at once and keeps working: a link fetch can take seconds and the toast reports progress. */
function startLinkAdd(url: string, label: string, tabId: number | null, deps: RouterDependencies): void {
  void deps.linkCapture.add({ url, label, target: { kind: "last" }, tabId });
}
