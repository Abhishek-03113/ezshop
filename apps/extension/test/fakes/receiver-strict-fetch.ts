/**
 * A fetch that rejects being called as a method, like the browser's real fetch
 * ("Failed to execute 'fetch' on 'WorkerGlobalScope': Illegal invocation").
 * Regression guard for clients that stored fetch and called `this.fetchFunction(...)`.
 *
 * @example new FetchHtmlFetcher(new ReceiverStrictFetch(new Response("ok")).fetch)
 */
export class ReceiverStrictFetch {
  readonly urls: string[] = [];

  constructor(private readonly respond: () => Response) {}

  get fetch(): (input: string, init: RequestInit) => Promise<Response> {
    const urls = this.urls;
    const respond = this.respond;
    return function strictFetch(this: unknown, input: string): Promise<Response> {
      if (this !== undefined && this !== globalThis) return Promise.reject(new TypeError("Illegal invocation"));
      urls.push(input);
      return Promise.resolve(respond());
    };
  }
}
