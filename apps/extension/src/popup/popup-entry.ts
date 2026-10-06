import type { CaptureConfig } from "../capture-config.ts";
import { CAPTURE_PORT_NAME } from "../capture-protocol.ts";
import { adaptChromePort } from "../chrome-duplex-port.ts";
import { ChromeKeyValueStorage } from "../chrome-key-value-storage.ts";
import { SettingsStore } from "../settings.ts";
import { ChromeActiveTabSource } from "./active-tab-source.ts";
import { PortCaptureService } from "./capture-service.ts";
import { PopupController } from "./popup-controller.ts";

// Popup composition root. Replaced at build time by build.ts (Bun.build `define`).
declare const __PICKY_CAPTURE_CONFIG__: CaptureConfig;

const root = document.getElementById("root");
if (root === null) throw new Error('popup.html has no #root element; expected <div id="root"></div>');

void new PopupController({
  root,
  settings: new SettingsStore(new ChromeKeyValueStorage()),
  tabs: new ChromeActiveTabSource(),
  captureService: new PortCaptureService(() => adaptChromePort(chrome.runtime.connect({ name: CAPTURE_PORT_NAME }))),
  webBaseUrl: __PICKY_CAPTURE_CONFIG__.webBaseUrl,
}).start();
