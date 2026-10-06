import { describe, expect, test } from "bun:test";
import { SignInRequiredError } from "../src/sign-in-required.ts";
import { sendSnapshot } from "../src/snapshot-sender.ts";
import { FakeSnapshotApi } from "./fakes/fake-snapshot-api.ts";
import { buildSnapshot } from "./support/build-snapshot.ts";

describe("sendSnapshot", () => {
  test("posts the snapshot and returns the product id", async () => {
    const api = new FakeSnapshotApi(201, { product: { id: "p1" } });
    expect(await sendSnapshot(api.fetch, "http://api", buildSnapshot())).toBe("p1");
    expect(api.posts[0]?.url).toBe("http://api/api/snapshots");
    expect(api.posts[0]?.body).toMatchObject({ externalId: "B0FQG1YHYR" });
    expect(api.posts[0]?.credentials).toBe("include");
  });

  test("a 401 means nobody is signed in to Picky", async () => {
    const api = new FakeSnapshotApi(401, { message: "Sign in" });
    await expect(sendSnapshot(api.fetch, "http://api", buildSnapshot())).rejects.toBeInstanceOf(SignInRequiredError);
  });

  test("throws with the API's message", async () => {
    const api = new FakeSnapshotApi(400, { message: "title: Too small" });
    await expect(sendSnapshot(api.fetch, "http://api", buildSnapshot())).rejects.toThrow(
      "Picky API rejected snapshot B0FQG1YHYR: title: Too small",
    );
  });

  test("falls back to the status when the body has no message", async () => {
    const api = new FakeSnapshotApi(502, null);
    await expect(sendSnapshot(api.fetch, "http://api", buildSnapshot())).rejects.toThrow("HTTP 502");
  });
});
