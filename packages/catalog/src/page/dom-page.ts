import { normalizeText } from "../text/normalize-text.ts";
import { NON_TEXT_SELECTOR, type PageNode } from "./page-node.ts";

type DomRoot = Document | Element;

class DomPageNode implements PageNode {
  constructor(private readonly node: DomRoot) {}

  text(): string {
    const visible = this.node.cloneNode(true) as DomRoot;
    visible.querySelectorAll(NON_TEXT_SELECTOR).forEach((element) => element.remove());
    return normalizeText(visible.textContent ?? "");
  }

  attr(name: string): string | null {
    // Document has no attributes; only Elements do.
    return "getAttribute" in this.node ? this.node.getAttribute(name) : null;
  }

  findAll(selector: string): PageNode[] {
    return Array.from(this.node.querySelectorAll(selector), (element) => new DomPageNode(element));
  }
}

/**
 * Wraps a live DOM document (the extension's content script) as a PageNode.
 *
 * @example extractProductSnapshot(wrapDomDocument(document), location.href, new Date())
 */
export function wrapDomDocument(root: DomRoot): PageNode {
  return new DomPageNode(root);
}
