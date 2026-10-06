import type { ProductSnapshot } from "@picky/catalog";
import type { ExtensionResponse, QuickLookRequest, QuickLookState } from "../messaging/messages.ts";
import type { QuickLookApi } from "./quicklook-api.ts";

type SendMessage = (request: QuickLookRequest) => Promise<ExtensionResponse<QuickLookState> | undefined>;

/**
 * QuickLookApi over chrome.runtime.sendMessage. A missing reply (worker gone) or `ok: false` throws
 * with the reason, which the overlay shows.
 *
 * @example const state = await new ChromeQuickLookApi().init()
 */
export class ChromeQuickLookApi implements QuickLookApi {
  constructor(private readonly sendMessage: SendMessage = (request) => chrome.runtime.sendMessage(request)) {}

  init(): Promise<QuickLookState> {
    return this.ask({ type: "quicklook:init" });
  }

  select(comparisonId: string): Promise<QuickLookState> {
    return this.ask({ type: "quicklook:select", comparisonId });
  }

  add(comparisonId: string | null, snapshot: ProductSnapshot): Promise<QuickLookState> {
    return this.ask({ type: "quicklook:add", comparisonId, snapshot });
  }

  remove(comparisonId: string, productId: string): Promise<QuickLookState> {
    return this.ask({ type: "quicklook:remove", comparisonId, productId });
  }

  private async ask(request: QuickLookRequest): Promise<QuickLookState> {
    const response = await this.sendMessage(request);
    if (response === undefined) throw new Error(`Picky service worker did not answer ${request.type}; reload the page`);
    if (!response.ok) throw new Error(response.message);
    return response.body;
  }
}
