export interface RecordedSnapshotPost {
  url: string;
  body: unknown;
  credentials: RequestCredentials | undefined;
}

/** Stands in for POST /api/snapshots: one canned status and body, recording each call. */
export class FakeSnapshotApi {
  readonly posts: RecordedSnapshotPost[] = [];

  constructor(
    private readonly status: number,
    private readonly responseBody: unknown,
  ) {}

  readonly fetch = async (url: string, init: RequestInit): Promise<Response> => {
    this.posts.push({ url, body: JSON.parse(String(init.body)), credentials: init.credentials });
    return Response.json(this.responseBody, { status: this.status });
  };
}
