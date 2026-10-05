import { describe, expect, test } from "bun:test";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";
import { findFirst, firstAttr, firstText } from "../src/page/page-node.ts";

const page = parseHtmlPage(`
  <div class="price"><span class="a-offscreen"> </span><span aria-hidden="true">₹999</span></div>
  <img id="hero" src="a.jpg"><p class="note">first</p><p class="note">second</p>`);

describe("findFirst", () => {
  test("returns the first match or null", () => {
    expect(findFirst(page, ".note")?.text()).toBe("first");
    expect(findFirst(page, ".missing")).toBeNull();
  });
});

describe("firstText", () => {
  test("skips selectors whose text is blank", () => {
    expect(firstText(page, [".price .a-offscreen", ".price [aria-hidden='true']"])).toBe("₹999");
  });

  test("returns null when no selector has text", () => {
    expect(firstText(page, [".missing"])).toBeNull();
  });
});

describe("firstAttr", () => {
  test("reads an attribute of the first match", () => {
    expect(firstAttr(page, "#hero", "src")).toBe("a.jpg");
    expect(firstAttr(page, "#hero", "alt")).toBeNull();
  });
});
