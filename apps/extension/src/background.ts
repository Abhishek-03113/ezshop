import type { CaptureConfig } from "./capture-config.ts";
import { runCaptureFlow } from "./capture-flow.ts";
import { ChromeBrowserPort } from "./chrome-browser-port.ts";
import { sendSnapshot } from "./snapshot-sender.ts";

// Service-worker composition root: wires the capture flow to chrome.* and the ezshop API.
// Replaced at build time by build.ts (Bun.build `define`).
declare const __EZSHOP_CAPTURE_CONFIG__: CaptureConfig;
const config = __EZSHOP_CAPTURE_CONFIG__;
const browser = new ChromeBrowserPort("page-capture.js");
const log = (event: string, fields: Record<string, string | number>) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined || tab.url === undefined) return;
  void runCaptureFlow(
    { id: tab.id, url: tab.url },
    {
      browser,
      config,
      sendSnapshot: (snapshot) => sendSnapshot(fetch, config.apiBaseUrl, snapshot),
      log,
    },
  );
});
