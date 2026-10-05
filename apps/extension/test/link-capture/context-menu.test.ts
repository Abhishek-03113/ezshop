import { describe, expect, test } from "bun:test";
import { addTargetFromMenuItem, buildMenuEntries } from "../../src/link-capture/context-menu-model.ts";
import { MenuRefresher } from "../../src/link-capture/menu-refresher.ts";
import { FakeComparisonsClient } from "../fakes/fake-comparisons-client.ts";
import { FakeContextMenu } from "../fakes/fake-link-capture-ports.ts";

const COMPARISONS = [
  { id: "c1", name: "Home & office", productIds: [], updatedAt: "t" },
  { id: "c2", name: "Monitors", productIds: [], updatedAt: "t" },
];

describe("buildMenuEntries", () => {
  test("puts the labelled last-used comparison first, then others, a separator, Library only and New", () => {
    const entries = buildMenuEntries(COMPARISONS, "c2");
    expect(entries.map((entry) => entry.title)).toEqual([
      "Add to ezshop",
      "Monitors (last used)",
      "Home && office",
      "",
      "Library only",
      "New comparison…",
    ]);
    expect(entries[3]?.kind).toBe("separator");
    expect(entries.slice(1).every((entry) => entry.parentId === "ezshop:add")).toBe(true);
  });
  test("keeps order and omits the separator when nothing is remembered or nothing exists", () => {
    expect(buildMenuEntries(COMPARISONS, null).map((entry) => entry.title)[1]).toBe("Home && office");
    expect(buildMenuEntries([], null).map((entry) => entry.title)).toEqual([
      "Add to ezshop",
      "Library only",
      "New comparison…",
    ]);
  });
});

describe("addTargetFromMenuItem", () => {
  test("maps item ids to targets", () => {
    expect(addTargetFromMenuItem("ezshop:cmp:c9")).toEqual({ kind: "comparison", comparisonId: "c9" });
    expect(addTargetFromMenuItem("ezshop:library")).toEqual({ kind: "library" });
    expect(addTargetFromMenuItem("ezshop:new")).toEqual({ kind: "new" });
  });
  test("ignores the root and foreign items", () => {
    expect(addTargetFromMenuItem("ezshop:add")).toBeNull();
    expect(addTargetFromMenuItem(42)).toBeNull();
  });
});

describe("MenuRefresher", () => {
  test("rebuilds the menu from the API with the last-used comparison", async () => {
    const menu = new FakeContextMenu();
    const client = new FakeComparisonsClient([{ id: "c1", name: "Monitors", productIds: [] }]);
    await new MenuRefresher(
      client,
      menu,
      async () => "c1",
      () => {},
    ).refresh();
    expect(menu.menus[0]?.map((entry) => entry.title)).toContain("Monitors (last used)");
  });
  test("still offers Library only when the API is down", async () => {
    const menu = new FakeContextMenu();
    const client = new FakeComparisonsClient();
    client.failWith = new Error("offline");
    const logged: string[] = [];
    await new MenuRefresher(
      client,
      menu,
      async () => null,
      (event) => void logged.push(event),
    ).refresh();
    expect(menu.menus[0]?.map((entry) => entry.title)).toEqual(["Add to ezshop", "Library only", "New comparison…"]);
    expect(logged).toEqual(["menu.comparisons_unavailable"]);
  });
});
