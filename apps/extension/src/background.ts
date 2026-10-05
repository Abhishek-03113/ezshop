import type { CaptureConfig } from "./capture-config.ts";
import { runCaptureFlow } from "./capture-flow.ts";
import { CAPTURE_PORT_NAME } from "./capture-protocol.ts";
import { adaptChromePort } from "./chrome-duplex-port.ts";
import { ChromeBrowserPort } from "./chrome-browser-port.ts";
import { ChromeKeyValueStorage } from "./chrome-key-value-storage.ts";
import { serveCaptureRequests } from "./serve-capture-requests.ts";
import { SettingsStore } from "./settings.ts";
import { sendSnapshot } from "./snapshot-sender.ts";

// Service-worker composition root: wires the capture flow to chrome.* and the ezshop API.
// The toolbar button opens popup.html (which asks this worker to capture over a port), so
// chrome.action.onClicked no longer fires; Alt+Shift+E (_execute_action) opens that same popup.
// Replaced at build time by build.ts (Bun.build `define`).
declare const __EZSHOP_CAPTURE_CONFIG__: CaptureConfig;
const config = __EZSHOP_CAPTURE_CONFIG__;
const browser = new ChromeBrowserPort("page-capture.js");
const settings = new SettingsStore(new ChromeKeyValueStorage());
const log = (event: string, fields: Record<string, string | number>) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== CAPTURE_PORT_NAME) return;
  serveCaptureRequests(adaptChromePort(port), (tab, onProgress) =>
    runCaptureFlow(
      tab,
      { browser, config, settings, sendSnapshot: (snapshot) => sendSnapshot(fetch, config.apiBaseUrl, snapshot), log },
      onProgress,
    ),
  );
});
