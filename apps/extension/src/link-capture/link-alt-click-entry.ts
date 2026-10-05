import type { LinkAddRequest } from "../messaging/messages.ts";
import { looksLikeProductLink, productLinkFromClick } from "./product-link.ts";

// The one always-on content script (amazon.in / flipkart.com only). Alt+click on a product link must be
// intercepted in the page before the browser follows or downloads it, and only a content script can see
// clicks there; activeTab cannot, because it is granted on toolbar/menu actions, not on page clicks.
// It reads nothing from the page except the clicked anchor, and sends no network requests itself.
window.addEventListener(
  "click",
  (event: MouseEvent) => {
    if (!event.altKey) return;
    const link = productLinkFromClick(event.target, looksLikeProductLink);
    if (link === null) return;
    event.preventDefault();
    event.stopPropagation();
    const request: LinkAddRequest = { type: "link:add", url: link.url, label: link.label };
    void chrome.runtime.sendMessage(request);
  },
  true,
);
