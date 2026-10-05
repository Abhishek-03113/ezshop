/** Stands in for chrome.runtime.sendMessage: one canned reply, recording each request. */
export class FakeRuntimeMessenger<Request, Reply> {
  readonly sent: Request[] = [];

  constructor(private readonly reply: Reply | undefined) {}

  readonly send = async (request: Request): Promise<Reply | undefined> => {
    this.sent.push(request);
    return this.reply;
  };
}
