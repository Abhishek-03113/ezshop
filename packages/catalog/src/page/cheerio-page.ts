import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import { normalizeText } from "../text/normalize-text.ts";
import type { PageNode } from "./page-node.ts";

class CheerioPageNode implements PageNode {
  constructor(
    private readonly $: CheerioAPI,
    private readonly selection: Cheerio<AnyNode>,
  ) {}

  text(): string {
    return normalizeText(this.selection.text());
  }

  attr(name: string): string | null {
    return this.selection.attr(name) ?? null;
  }

  findAll(selector: string): PageNode[] {
    return this.selection
      .find(selector)
      .toArray()
      .map((element) => new CheerioPageNode(this.$, this.$(element)));
  }
}

/**
 * Parses raw HTML (e.g. Firecrawl's `rawHtml`) into a PageNode rooted at the document.
 *
 * @example extractProductSnapshot(parseHtmlPage(html), url, new Date())
 */
export function parseHtmlPage(html: string): PageNode {
  const $ = load(html);
  return new CheerioPageNode($, $.root());
}
