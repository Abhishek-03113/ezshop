import { ToastStack } from "./toast-host.ts";

// Injected into the tab a context-menu click or Alt+click came from (classic IIFE). build.ts defines the CSS
// (tokens + toast.css) as one string for the closed shadow root.
declare const __EZSHOP_TOAST_CSS__: string;

function createStack(): ToastStack {
  const host = document.createElement("ezshop-toasts");
  const root = host.attachShadow({ mode: "closed" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(__EZSHOP_TOAST_CSS__);
  root.adoptedStyleSheets = [sheet];
  const stack = document.createElement("div");
  stack.className = "stack";
  stack.setAttribute("role", "status");
  stack.setAttribute("aria-live", "polite");
  root.append(stack);
  document.documentElement.append(host);
  return new ToastStack(stack, (request) => void chrome.runtime.sendMessage(request));
}

let stack: ToastStack | null = null;
globalThis.ezshopToast ??= (message) => {
  stack ??= createStack();
  stack.show(message);
};
