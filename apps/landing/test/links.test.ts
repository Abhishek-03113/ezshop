import { describe, expect, test } from "bun:test";
import { appHomeUrl, buildLandingLinks, DEFAULT_EXTENSION_URL, DEFAULT_WEB_URL } from "../src/lib/links.ts";

describe("buildLandingLinks", () => {
  test("falls back to local web app and the in-page #how anchor", () => {
    expect(buildLandingLinks({})).toEqual({ webUrl: DEFAULT_WEB_URL, extensionUrl: DEFAULT_EXTENSION_URL });
  });

  test("uses env values and trims trailing slashes from the web url", () => {
    const links = buildLandingLinks({
      VITE_PICKY_WEB_URL: "https://app.example/",
      VITE_PICKY_EXTENSION_URL: "https://store.example/x",
    });
    expect(links).toEqual({ webUrl: "https://app.example", extensionUrl: "https://store.example/x" });
  });

  test("treats blank env values as unset", () => {
    expect(buildLandingLinks({ VITE_PICKY_WEB_URL: "  " }).webUrl).toBe(DEFAULT_WEB_URL);
  });
});

describe("appHomeUrl", () => {
  test("points at the web app root", () => {
    expect(appHomeUrl({ webUrl: "http://localhost:5173", extensionUrl: "#how" })).toBe("http://localhost:5173/");
  });
});
