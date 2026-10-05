import { describe, expect, test } from "bun:test";
import type { LinkAddJob } from "../src/link-capture/link-capture-service.ts";
import { routeRequest, type RouterDependencies } from "../src/message-router.ts";
import { stateWith } from "./support/quicklook-state.ts";
import { buildSnapshot } from "./support/build-snapshot.ts";

function setup(failInit = false) {
  const calls: string[] = [];
  const jobs: LinkAddJob[] = [];
  const state = stateWith("c1", []);
  const deps: RouterDependencies = {
    quickLook: {
      init: async () => {
        if (failInit) throw new Error("API down");
        calls.push("init");
        return state;
      },
      select: async (id) => (calls.push(`select ${id}`), state),
      add: async (id, snapshot) => (calls.push(`add ${id} ${snapshot.externalId}`), state),
      remove: async (id, productId) => (calls.push(`remove ${id} ${productId}`), state),
    },
    linkCapture: {
      add: async (job) => void jobs.push(job),
      undo: async (id, productId) => void calls.push(`undo ${id} ${productId}`),
    },
    openQuickLook: async (tabId) => void calls.push(`open ${tabId}`),
  };
  return { deps, calls, jobs, state };
}

const sender = { tabId: 7 };

describe("routeRequest", () => {
  test("quick look requests reach the service and wrap the state", async () => {
    const { deps, calls, state } = setup();
    expect(await routeRequest({ type: "quicklook:init" }, sender, deps)).toEqual({ ok: true, body: state });
    await routeRequest({ type: "quicklook:select", comparisonId: "c2" }, sender, deps);
    await routeRequest({ type: "quicklook:add", comparisonId: null, snapshot: buildSnapshot() }, sender, deps);
    await routeRequest({ type: "quicklook:remove", comparisonId: "c1", productId: "p1" }, sender, deps);
    expect(calls).toEqual(["init", "select c2", "add null B0FQG1YHYR", "remove c1 p1"]);
  });

  test("errors become ok:false with the message", async () => {
    expect(await routeRequest({ type: "quicklook:init" }, sender, setup(true).deps)).toEqual({
      ok: false,
      message: "API down",
    });
  });

  test("link:add starts a last-used capture in the sender's tab", async () => {
    const { deps, jobs } = setup();
    await routeRequest({ type: "link:add", url: "https://www.amazon.in/dp/B0FQG1YHYR", label: "LG" }, sender, deps);
    expect(jobs).toEqual([
      { url: "https://www.amazon.in/dp/B0FQG1YHYR", label: "LG", target: { kind: "last" }, tabId: 7 },
    ]);
  });

  test("toast buttons undo or open Quick Look in the sender's tab", async () => {
    const { deps, calls } = setup();
    await routeRequest({ type: "toast:undo", comparisonId: "c1", productId: "p1" }, sender, deps);
    await routeRequest({ type: "toast:quicklook" }, sender, deps);
    await routeRequest({ type: "toast:quicklook" }, { tabId: null }, deps);
    expect(calls).toEqual(["undo c1 p1", "open 7"]);
  });
});
