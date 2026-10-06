import type { ProductSnapshot } from "@picky/catalog";
import { needsSignIn, SignInRequiredError } from "./sign-in-required.ts";

type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Posts a captured snapshot to the signed-in user's Picky library and returns the stored product's id.
 * Throws SignInRequiredError when nobody is signed in, else the API's message (or the status) when it refuses.
 *
 * @example const productId = await sendSnapshot(fetch, "http://localhost:8787", snapshot)
 */
export async function sendSnapshot(
  fetchFunction: FetchFunction,
  apiBaseUrl: string,
  snapshot: ProductSnapshot,
): Promise<string> {
  const response = await fetchFunction(`${apiBaseUrl}/api/snapshots`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(snapshot),
    // The web app's session cookie: the extension rides the user's Picky sign-in.
    credentials: "include",
  });
  if (needsSignIn(response)) throw new SignInRequiredError();
  const body = (await response.json().catch(() => null)) as { product?: { id?: unknown }; message?: unknown } | null;
  const productId = body?.product?.id;
  if (response.ok && typeof productId === "string") return productId;
  const reason = typeof body?.message === "string" ? body.message : `HTTP ${response.status}`;
  throw new Error(`Picky API rejected snapshot ${snapshot.externalId}: ${reason}`);
}
