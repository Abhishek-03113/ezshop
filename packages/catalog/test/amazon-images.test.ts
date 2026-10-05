import { describe, expect, test } from "bun:test";
import { enlargeAmazonImageUrl, extractAmazonImages } from "../src/extract/amazon/amazon-images.ts";
import { parseHtmlPage } from "../src/page/cheerio-page.ts";

const BASE = "https://m.media-amazon.com/images/I";

describe("extractAmazonImages", () => {
  test("puts the landing image first and skips MAIN and video thumbnails", () => {
    const page = parseHtmlPage(`<img id="landingImage" data-old-hires="${BASE}/main._SL1500_.jpg">
      <div id="altImages"><ul>
        <li class="imageThumbnail variant-MAIN"><img src="${BASE}/m._SX38_.jpg"></li>
        <li class="videoThumbnail"><img src="${BASE}/v._SX35_.jpg"></li>
        <li class="imageThumbnail variant-PT01"><img src="${BASE}/p1._SX38_SY50_CR,0,0,38,50_.jpg"></li>
      </ul></div>`);
    expect(extractAmazonImages(page)).toEqual([`${BASE}/main._SL1500_.jpg`, `${BASE}/p1._SL1000_.jpg`]);
  });

  test("falls back to the landing image src and returns [] when absent", () => {
    expect(extractAmazonImages(parseHtmlPage(`<img id="landingImage" src="${BASE}/a.jpg">`))).toEqual([
      `${BASE}/a.jpg`,
    ]);
    expect(extractAmazonImages(parseHtmlPage("<p></p>"))).toEqual([]);
  });
});

describe("enlargeAmazonImageUrl", () => {
  test("replaces the resize directive and leaves plain URLs alone", () => {
    expect(enlargeAmazonImageUrl(`${BASE}/abc._SX38_SY50_.jpg`)).toBe(`${BASE}/abc._SL1000_.jpg`);
    expect(enlargeAmazonImageUrl(`${BASE}/abc.jpg`)).toBe(`${BASE}/abc.jpg`);
  });
});
