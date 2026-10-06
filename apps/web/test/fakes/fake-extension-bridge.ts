import type { ExtensionBridge } from "../../src/api/extension-bridge.ts";

/** ExtensionBridge that records imported URLs and answers with `productId`; `available: false` means not installed. */
export class FakeExtensionBridge implements ExtensionBridge {
  readonly importedUrls: string[] = [];

  constructor(
    private readonly available = true,
    private readonly productId = "p1",
  ) {}

  isAvailable(): boolean {
    return this.available;
  }

  async importLink(url: string): Promise<string> {
    this.importedUrls.push(url);
    return this.productId;
  }
}
