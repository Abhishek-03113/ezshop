import type { Dom } from "./dom.ts";

export interface ShellOptions {
  /** Small grey text at the right of the header, e.g. the site being read. */
  hostLabel?: string;
  /** When set, the header shows the library icon button linking here. */
  libraryUrl?: string;
}

/**
 * The popup frame every state shares: 52px header (logo, name, optional host or library link)
 * above the state's body.
 *
 * @example root.replaceChildren(renderShell(dom, { libraryUrl: "http://localhost:5173/" }, body))
 */
export function renderShell(dom: Dom, options: ShellOptions, body: HTMLElement): HTMLElement {
  return dom.el("div", { className: "popup" }, [renderHeader(dom, options), body]);
}

function renderHeader(dom: Dom, options: ShellOptions): HTMLElement {
  const header = dom.el("header", { className: "header" }, [
    dom.icon("logo", "logo"),
    dom.el("span", { className: "brand", text: "ezshop" }),
  ]);
  if (options.hostLabel !== undefined) {
    header.append(dom.el("span", { className: "header-host", text: options.hostLabel }));
  }
  if (options.libraryUrl !== undefined) header.append(renderLibraryLink(dom, options.libraryUrl));
  return header;
}

function renderLibraryLink(dom: Dom, libraryUrl: string): HTMLElement {
  const attrs = { href: libraryUrl, target: "_blank", rel: "noopener", "aria-label": "Open library" };
  return dom.el("a", { className: "icon-button", attrs }, [dom.icon("library", "icon-md")]);
}
