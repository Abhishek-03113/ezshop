import { normalizeText } from "../text/normalize-text.ts";
import type { PageNode } from "./page-node.ts";

type DomRoot = Document | Element;

class DomPageNode implements PageNode {
  constructor(private readonly node: DomRoot) {}

  text(): string {
    return normalizeText(this.node.textContent ?? "");
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
