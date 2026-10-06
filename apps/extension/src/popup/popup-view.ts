import { renderCapturingView } from "./capturing-view.ts";
import type { Dom } from "./dom.ts";
import { renderErrorView } from "./error-view.ts";
import type { PopupState } from "./popup-state.ts";
import { renderSavedView } from "./saved-view.ts";
import { renderSpecSheetView } from "./specs/spec-sheet-view.ts";
import { renderShell, type ShellOptions } from "./shell.ts";
import { renderUnsupportedView } from "./unsupported-view.ts";
import { renderWelcomeView } from "./welcome-view.ts";

export interface PopupViewContext {
  webBaseUrl: string;
  /** Site being read, e.g. "amazon.in"; shown in the header while capturing. */
  hostLabel: string | null;
  autoOpen: boolean;
  onDismissWelcome: () => void;
  onRetry: () => void;
  onAutoOpenChange: (checked: boolean) => void;
  onViewSpecs: () => void;
  onBackToSaved: () => void;
}

/**
 * Renders the whole popup (header + body) for one state.
 *
 * @example root.replaceChildren(renderPopupView(dom, { kind: "unsupported" }, context))
 */
export function renderPopupView(dom: Dom, state: PopupState, context: PopupViewContext): HTMLElement {
  const libraryUrl = `${context.webBaseUrl}/`;
  switch (state.kind) {
    case "welcome":
      return renderShell(dom, {}, renderWelcomeView(dom, { onDismiss: context.onDismissWelcome }));
    case "capturing":
      return renderShell(
        dom,
        hostOptions(context),
        renderCapturingView(dom, { phase: state.phase, autoOpen: context.autoOpen }),
      );
    case "saved":
      return renderShell(
        dom,
        { libraryUrl },
        renderSavedView(
          dom,
          { summary: state.summary, webBaseUrl: context.webBaseUrl, autoOpen: context.autoOpen },
          context,
        ),
      );
    case "specs":
      return renderShell(
        dom,
        { libraryUrl, onBack: context.onBackToSaved, title: "Specifications" },
        renderSpecSheetView(dom, state.summary.snapshot),
      );
    case "unsupported":
      return renderShell(dom, { libraryUrl }, renderUnsupportedView(dom, context.webBaseUrl));
    case "failed":
      return renderShell(dom, { libraryUrl }, renderErrorView(dom, state.message, context.webBaseUrl, context));
  }
}

function hostOptions(context: PopupViewContext): ShellOptions {
  return context.hostLabel === null ? {} : { hostLabel: context.hostLabel };
}
