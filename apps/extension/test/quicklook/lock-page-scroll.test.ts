import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { lockPageScroll } from "../../src/quicklook/overlay-host.ts";

describe("lockPageScroll", () => {
  test("hides page overflow while open and restores the page's own value on release", () => {
    const document = new Window().document as unknown as Document;
    document.documentElement.style.overflow = "auto";
    const release = lockPageScroll(document);
    expect(document.documentElement.style.overflow).toBe("hidden");
    release();
    expect(document.documentElement.style.overflow).toBe("auto");
  });
});
