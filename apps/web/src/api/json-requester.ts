export type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>;

/** The API answered with a non-2xx status. `message` is the API's own explanation when it sent one. */
export class ApiRequestError extends Error {
  override readonly name = "ApiRequestError";
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type JsonRequester = <T>(path: string, init?: RequestInit) => Promise<T>;

/**
 * Builds the request function every API client shares: JSON in, JSON out, errors as ApiRequestError.
 * A 204 answer (DELETE) resolves to undefined, so callers that expect no body type it as void.
 *
 * @example const request = createJsonRequester(fetch, ""); await request<{ products: [] }>("/api/products")
 */
export function createJsonRequester(fetchFunction: FetchFunction, baseUrl: string): JsonRequester {
  return async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetchFunction(`${baseUrl}${path}`, init);
    if (!response.ok) throw await toApiRequestError(path, response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  };
}

/**
 * Request init for a JSON body.
 *
 * @example jsonRequest("POST", { name: "Monitors" })
 */
export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

async function toApiRequestError(path: string, response: Response): Promise<ApiRequestError> {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  const apiMessage = typeof body?.message === "string" ? body.message : null;
  return new ApiRequestError(apiMessage ?? `Request to ${path} failed with HTTP ${response.status}`, response.status);
}
