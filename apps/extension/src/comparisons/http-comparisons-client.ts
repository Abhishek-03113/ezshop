import type { CatalogComparisonDetail, CatalogComparisonSummary } from "@picky/catalog";
import { needsSignIn, SignInRequiredError } from "../sign-in-required.ts";
import type { ComparisonsClient, CreatedComparison } from "./comparisons-client.ts";

type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;
type JsonRecord = Readonly<Record<string, unknown>>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : null;
}

/**
 * ComparisonsClient over the Picky HTTP API, as the user signed in to the web app (its session cookie
 * goes along). A 401 throws SignInRequiredError; other failures throw with the method, path and the
 * API's message (or status), so toasts and logs can say what went wrong.
 *
 * @example const comparisons = await new HttpComparisonsClient(fetch, "http://localhost:8787").list()
 */
export class HttpComparisonsClient implements ComparisonsClient {
  constructor(
    private readonly fetchFunction: FetchFunction,
    private readonly apiBaseUrl: string,
  ) {}

  async list(): Promise<CatalogComparisonSummary[]> {
    const body = await this.request("GET", "/api/comparisons");
    const comparisons = body.comparisons;
    if (!Array.isArray(comparisons)) throw this.malformed("GET", "/api/comparisons", "comparisons: []", body);
    return comparisons as CatalogComparisonSummary[];
  }

  async get(comparisonId: string): Promise<CatalogComparisonDetail> {
    const path = `/api/comparisons/${encodeURIComponent(comparisonId)}`;
    const comparison = asRecord((await this.request("GET", path)).comparison);
    if (comparison === null) throw this.malformed("GET", path, "{ comparison: { products: [] } }", comparison);
    return comparison as unknown as CatalogComparisonDetail;
  }

  async create(name: string, productIds: readonly string[] = []): Promise<CreatedComparison> {
    const body = await this.request("POST", "/api/comparisons", { name, productIds });
    const comparison = asRecord(body.comparison);
    if (typeof comparison?.id !== "string" || typeof comparison.name !== "string") {
      throw this.malformed("POST", "/api/comparisons", "{ comparison: { id, name } }", body);
    }
    return { id: comparison.id, name: comparison.name };
  }

  async addProduct(comparisonId: string, productId: string): Promise<void> {
    await this.request("PUT", this.productPath(comparisonId, productId));
  }

  async removeProduct(comparisonId: string, productId: string): Promise<void> {
    await this.request("DELETE", this.productPath(comparisonId, productId));
  }

  private productPath(comparisonId: string, productId: string): string {
    return `/api/comparisons/${encodeURIComponent(comparisonId)}/products/${encodeURIComponent(productId)}`;
  }

  private async request(method: string, path: string, payload?: unknown): Promise<JsonRecord> {
    // Bare call: the browser's fetch throws "Illegal invocation" when invoked as a method of this client.
    const { fetchFunction } = this;
    const response = await fetchFunction(`${this.apiBaseUrl}${path}`, {
      method,
      headers: payload === undefined ? {} : { "content-type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      credentials: "include",
    });
    if (needsSignIn(response)) throw new SignInRequiredError();
    const body = asRecord(await response.json().catch(() => null)) ?? {};
    if (response.ok) return body;
    const reason = typeof body.message === "string" ? body.message : `HTTP ${response.status}`;
    throw new Error(`Picky API ${method} ${path} failed: ${reason}`);
  }

  private malformed(method: string, path: string, expected: string, received: unknown): Error {
    return new Error(`Picky API ${method} ${path} returned ${JSON.stringify(received)}; expected ${expected}`);
  }
}
