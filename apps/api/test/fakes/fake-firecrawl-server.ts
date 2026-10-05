export interface RecordedScrapeCall {
  url: string;
  body: Record<string, unknown>;
}

/** Stands in for Firecrawl's HTTP API: returns one canned response and records each call. */
export class FakeFirecrawlServer {
  readonly calls: RecordedScrapeCall[] = [];

  constructor(
    private readonly status: number,
    private readonly responseBody: unknown,
  ) {}

  readonly fetch = async (url: string, init: RequestInit): Promise<Response> => {
    this.calls.push({ url, body: JSON.parse(String(init.body)) as Record<string, unknown> });
    return Response.json(this.responseBody, { status: this.status });
  };
}
