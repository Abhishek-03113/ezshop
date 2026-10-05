export interface RecordedApiCall {
  url: string;
  method: string;
  body: string | null;
}

/** Stands in for the ezshop API: answers every call with one canned status and body, recording calls. */
export class FakeApiServer {
  readonly calls: RecordedApiCall[] = [];

  constructor(
    private readonly status: number,
    private readonly responseBody: unknown,
  ) {}

  readonly fetch = async (url: string, init?: RequestInit): Promise<Response> => {
    this.calls.push({ url, method: init?.method ?? "GET", body: init?.body === undefined ? null : String(init.body) });
    return Response.json(this.responseBody, { status: this.status });
  };
}
