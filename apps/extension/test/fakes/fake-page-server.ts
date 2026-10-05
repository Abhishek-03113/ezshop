export interface RecordedPageRequest {
  url: string;
  credentials: RequestCredentials | undefined;
}

/** Stands in for a marketplace: one canned status and body, recording url and credentials mode. */
export class FakePageServer {
  readonly requests: RecordedPageRequest[] = [];

  constructor(
    private readonly status: number,
    private readonly body: string,
  ) {}

  readonly fetch = async (url: string, init: RequestInit): Promise<Response> => {
    this.requests.push({ url, credentials: init.credentials });
    return new Response(this.body, { status: this.status });
  };
}
