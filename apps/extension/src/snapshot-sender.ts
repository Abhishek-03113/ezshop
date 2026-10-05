import type { ProductSnapshot } from "@ezshop/catalog";

type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Posts a captured snapshot to the ezshop API and returns the stored product's id.
 * Throws with the API's message (or the status) when the API refuses it.
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
  });
  const body = (await response.json().catch(() => null)) as { product?: { id?: unknown }; message?: unknown } | null;
  const productId = body?.product?.id;
  if (response.ok && typeof productId === "string") return productId;
  const reason = typeof body?.message === "string" ? body.message : `HTTP ${response.status}`;
  throw new Error(`ezshop API rejected snapshot ${snapshot.externalId}: ${reason}`);
}
