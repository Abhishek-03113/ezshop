export interface RecordedRequest {
  method: string;
  url: string;
  body: unknown;
  credentials: RequestCredentials | undefined;
}

/** Stands in for any JSON endpoint: one canned status and body, recording each request. */
export class FakeHttpApi {
  readonly requests: RecordedRequest[] = [];

  constructor(
    private readonly status: number,
    private readonly responseBody: unknown,
  ) {}

  readonly fetch = async (url: string, init: RequestInit): Promise<Response> => {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    this.requests.push({ method: init.method ?? "GET", url, body, credentials: init.credentials });
    return this.responseBody === null
      ? new Response("oops", { status: this.status })
      : Response.json(this.responseBody, { status: this.status });
  };
}
