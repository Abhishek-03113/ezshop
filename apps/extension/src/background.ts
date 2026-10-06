import type { CaptureConfig } from "./capture-config.ts";
import { runCaptureFlow } from "./capture-flow.ts";
import { CAPTURE_PORT_NAME } from "./capture-protocol.ts";
import { adaptChromePort } from "./chrome-duplex-port.ts";
import { ChromeBrowserPort } from "./chrome-browser-port.ts";
import { ChromeKeyValueStorage } from "./chrome-key-value-storage.ts";
import { HttpComparisonsClient } from "./comparisons/http-comparisons-client.ts";
import { BadgeCounter, ChromeBadgeText } from "./link-capture/badge-counter.ts";
import { ChromeContextMenu } from "./link-capture/chrome-context-menu.ts";
import { ChromeSnapshotReader } from "./link-capture/chrome-snapshot-reader.ts";
import { menuClickFromItem } from "./link-capture/context-menu-model.ts";
import { FetchHtmlFetcher } from "./link-capture/html-fetcher.ts";
import { LinkCaptureService } from "./link-capture/link-capture-service.ts";
import { MenuRefresher } from "./link-capture/menu-refresher.ts";
import { isExtensionRequest } from "./messaging/messages.ts";
import { routeRequest } from "./message-router.ts";
import { serveCaptureRequests } from "./serve-capture-requests.ts";
import { SettingsStore } from "./settings.ts";
import { sendSnapshot } from "./snapshot-sender.ts";
import { ChromeQuickLookTabPort } from "./quicklook/chrome-quicklook-tab-port.ts";
import { toggleQuickLook } from "./quicklook/quicklook-launcher.ts";
import { viewForCommand } from "./quicklook/quicklook-model.ts";
import { QuickLookService } from "./quicklook/quicklook-service.ts";
import { ChromeToastPort } from "./toast/toast-port.ts";

// Service-worker composition root. The toolbar button (and Alt+Shift+S, _execute_action) fires
// chrome.action.onClicked and toggles the in-page Quick Look on Specs; Alt+Shift+V (open-comparison) toggles it on Compare; when a tab cannot be scripted the worker
// switches that tab to popup.html, which asks this worker to capture over a port (the original flow).
// Replaced at build time by build.ts (Bun.build `define`).
declare const __PICKY_CAPTURE_CONFIG__: CaptureConfig;
const config = __PICKY_CAPTURE_CONFIG__;
const browser = new ChromeBrowserPort("page-capture.js");
const settings = new SettingsStore(new ChromeKeyValueStorage());
const log = (event: string, fields: Record<string, string | number>) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));
const post = (snapshot: Parameters<typeof sendSnapshot>[2]) => sendSnapshot(fetch, config.apiBaseUrl, snapshot);
const comparisons = new HttpComparisonsClient(fetch, config.apiBaseUrl);
const tabPort = new ChromeQuickLookTabPort("quicklook.js", "popup.html");
const menuRefresher = new MenuRefresher(comparisons, new ChromeContextMenu(), () => settings.lastComparisonId(), log);
const refreshMenu = () => void menuRefresher.refresh();

const quickLook = new QuickLookService({
  comparisons,
  settings,
  sendSnapshot: post,
  webBaseUrl: config.webBaseUrl,
  onComparisonsChanged: refreshMenu,
});
const linkCapture = new LinkCaptureService({
  fetcher: new FetchHtmlFetcher(fetch),
  reader: new ChromeSnapshotReader("offscreen.html"),
  capturePage: (tabId) => browser.capturePageInTab(tabId),
  sendSnapshot: post,
  showQuickLook: (tabId, snapshot) => tabPort.injectAndShowProduct(tabId, snapshot),
  comparisons,
  settings,
  toasts: new ChromeToastPort("toast.js", log),
  badge: new BadgeCounter(new ChromeBadgeText()),
  newToastId: () => crypto.randomUUID(),
  onComparisonsChanged: refreshMenu,
  log,
});

chrome.action.onClicked.addListener((tab) => void toggleQuickLook(tab, tabPort, log, "specs"));
chrome.commands.onCommand.addListener((command, tab) => {
  const view = viewForCommand(command);
  if (view === null) return log("quicklook.unknown_command", { command });
  void toggleQuickLook(tab ?? {}, tabPort, log, view);
});
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === "loading") void tabPort.clearPopupFor(tabId).catch(() => undefined);
});

chrome.runtime.onInstalled.addListener(refreshMenu);
chrome.runtime.onStartup.addListener(refreshMenu);
refreshMenu();

// Right-click on a product link downloads it; right-click on an open product page reads its DOM.
// "Quick Look" on a link shows the linked product over the current page without saving it.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const click = menuClickFromItem(info.menuItemId);
  if (click === null) return;
  if (click.action === "quicklook") {
    if (info.linkUrl !== undefined && tab?.id !== undefined) void linkCapture.quickLook(info.linkUrl, tab.id);
    return;
  }
  const url = click.source === "page" ? info.pageUrl : info.linkUrl;
  if (url === undefined) return;
  const label = click.source === "page" ? (tab?.title ?? "") : "";
  void linkCapture.add({ url, label, target: click.target, tabId: tab?.id ?? null, source: click.source });
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!isExtensionRequest(message)) return false;
  const deps = {
    quickLook,
    linkCapture,
    openQuickLook: (tabId: number) => toggleQuickLook({ id: tabId }, tabPort, log, "compare"),
  };
  void routeRequest(message, { tabId: sender.tab?.id ?? null }, deps).then(sendResponse);
  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== CAPTURE_PORT_NAME) return;
  serveCaptureRequests(adaptChromePort(port), (tab, onProgress) =>
    runCaptureFlow(tab, { browser, config, settings, sendSnapshot: post, log }, onProgress),
  );
});
