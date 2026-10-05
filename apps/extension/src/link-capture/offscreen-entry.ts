import { isParseProductRequest, type ParseProductResponse } from "./offscreen-protocol.ts";
import { parseProductHtml } from "./parse-product-html.ts";

// Offscreen document (reason DOM_PARSER): service workers have no DOMParser, so the worker sends fetched
// HTML here and gets the extracted snapshot back.
chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: ParseProductResponse) => void) => {
    if (!isParseProductRequest(message)) return false;
    sendResponse(parseProductHtml(new DOMParser(), message.html, message.url, new Date()));
    return false;
  },
);
