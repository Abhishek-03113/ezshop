import { describe, expect, test } from "bun:test";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";
import { wrapDomDocument } from "../src/page/dom-page.ts";
import { domFromHtml } from "./support/dom-from-html.ts";

const SAMPLE = `<ul id="list"><li data-k="a"> One\u200e </li><li>Two</li></ul>`;

describe("cheerio and DOM adapters", () => {
  test("cheerio: text, attr and findAll", () => {
    const items = parseHtmlPage(SAMPLE).findAll("#list li");
    expect(items.map((item) => item.text())).toEqual(["One", "Two"]);
    expect(items[0]?.attr("data-k")).toBe("a");
    expect(items[1]?.attr("data-k")).toBeNull();
  });

  test("DOM: text, attr and findAll", () => {
    const items = wrapDomDocument(domFromHtml(SAMPLE)).findAll("#list li");
    expect(items.map((item) => item.text())).toEqual(["One", "Two"]);
    expect(items[0]?.attr("data-k")).toBe("a");
  });

  test("DOM document root has no attributes", () => {
    expect(wrapDomDocument(domFromHtml(SAMPLE)).attr("id")).toBeNull();
  });
});
