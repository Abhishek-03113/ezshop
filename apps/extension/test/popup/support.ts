import { Window } from "happy-dom";
import { Dom } from "../../src/popup/dom.ts";
import type { PopupViewContext } from "../../src/popup/popup-view.ts";

/** A fresh happy-dom document wrapped in Dom, plus its root element. */
export function createTestDom(): { dom: Dom; root: HTMLElement } {
  const window = new Window();
  const document = window.document as unknown as Document;
  const root = document.createElement("div");
  document.body.append(root);
  return { dom: new Dom(document), root };
}

export interface RecordedClicks {
  dismissed: number;
  retried: number;
  autoOpenChanges: boolean[];
}

/** A view context whose handlers record their calls. */
export function createTestContext(): { context: PopupViewContext; clicks: RecordedClicks } {
  const clicks: RecordedClicks = { dismissed: 0, retried: 0, autoOpenChanges: [] };
  const context: PopupViewContext = {
    webBaseUrl: "http://web",
    hostLabel: "amazon.in",
    autoOpen: true,
    onDismissWelcome: () => void (clicks.dismissed += 1),
    onRetry: () => void (clicks.retried += 1),
    onAutoOpenChange: (checked) => void clicks.autoOpenChanges.push(checked),
  };
  return { context, clicks };
}
