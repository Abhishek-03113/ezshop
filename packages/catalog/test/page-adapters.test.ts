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

  // Regression: Amazon nests page-state JSON in a <script> inside #availability.
  const WITH_SCRIPT = `<div id="availability"><span>In stock</span><script>{"asin":"B09XS7JWHH"}</script><style>.a{}</style></div>`;

  test("cheerio: text skips script and style content", () => {
    expect(parseHtmlPage(WITH_SCRIPT).findAll("#availability")[0]?.text()).toBe("In stock");
  });

  test("DOM: text skips script and style content", () => {
    expect(wrapDomDocument(domFromHtml(WITH_SCRIPT)).findAll("#availability")[0]?.text()).toBe("In stock");
  });
});
