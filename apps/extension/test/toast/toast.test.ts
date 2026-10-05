import { describe, expect, test } from "bun:test";
import type { ToastActionRequest } from "../../src/messaging/messages.ts";
import { ToastStack } from "../../src/toast/toast-host.ts";
import { addedDetail, type ToastMessage } from "../../src/toast/toast-message.ts";
import { createTestDom } from "../popup/support.ts";

const ADDED: Extract<ToastMessage, { kind: "added" }> = {
  kind: "added",
  id: "t1",
  title: "LG 27GR83Q",
  specCount: 54,
  placement: { comparisonName: "Monitors", count: 5 },
  undo: { comparisonId: "c1", productId: "p1" },
};

function setup() {
  const { root } = createTestDom();
  const sent: ToastActionRequest[] = [];
  return { root, sent, stack: new ToastStack(root, (request) => void sent.push(request)) };
}

describe("addedDetail", () => {
  test("says how many specs and where it went", () => {
    expect(addedDetail(ADDED)).toBe("54 specs · now 5 in Monitors");
    expect(addedDetail({ ...ADDED, placement: null })).toBe("54 specs · saved to your library");
  });
});

describe("ToastStack", () => {
  test("a reading toast is replaced in place by its result", () => {
    const { root, stack } = setup();
    stack.show({ kind: "reading", id: "t1", title: "LG", destination: "your comparison" });
    expect(root.textContent).toContain("Reading LG…");
    stack.show(ADDED);
    expect(root.querySelectorAll(".toast")).toHaveLength(1);
    expect(root.textContent).toContain("Added LG 27GR83Q");
  });

  test("Quick Look and Undo send their requests; Undo dismisses the toast", () => {
    const { root, sent, stack } = setup();
    stack.show(ADDED);
    const [quickLook, undo] = Array.from(root.querySelectorAll<HTMLElement>(".toast-action"));
    quickLook?.click();
    undo?.click();
    expect(sent).toEqual([{ type: "toast:quicklook" }, { type: "toast:undo", comparisonId: "c1", productId: "p1" }]);
    expect(root.querySelector(".toast")).toBeNull();
  });

  test("an added toast without undo (Library only) has only Quick Look", () => {
    const { root, stack } = setup();
    stack.show({ ...ADDED, undo: null });
    expect(Array.from(root.querySelectorAll(".toast-action"), (node) => node.textContent)).toEqual(["Quick Look"]);
  });

  test("a failed toast shows the reason and can be dismissed", () => {
    const { root, stack } = setup();
    stack.show({ kind: "failed", id: "t2", reason: "HTTP 503" });
    expect(root.textContent).toContain("HTTP 503");
    root.querySelector<HTMLElement>(".toast-action")?.click();
    expect(root.querySelector(".toast")).toBeNull();
  });

  test("remove drops a toast by id", () => {
    const { root, stack } = setup();
    stack.show(ADDED);
    stack.remove("t1");
    expect(root.querySelector(".toast")).toBeNull();
  });
});
