import type { ExtensionResponse, WebImportRequest } from "../messaging/messages.ts";
import { serveWebBridge } from "./serve-web-bridge.ts";

// Content script on the Picky web app only (origin baked in by build.ts). The page cannot fetch
// Amazon/Flipkart, so its paste-a-link form asks the worker through here.
serveWebBridge(window, (url) => {
  const request: WebImportRequest = { type: "web:import-link", url };
  return chrome.runtime.sendMessage<WebImportRequest, ExtensionResponse<string> | undefined>(request);
});
