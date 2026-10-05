/** Sets the toolbar badge; the Chrome implementation lives in background.ts's composition. */
export interface BadgeText {
  set(text: string): Promise<void>;
}

/**
 * Counts link fetches in flight and mirrors the count on the toolbar badge ("" when idle).
 *
 * @example const done = await counter.begin(); … ; await done()
 */
export class BadgeCounter {
  private inFlight = 0;

  constructor(private readonly badge: BadgeText) {}

  async begin(): Promise<void> {
    this.inFlight += 1;
    await this.show();
  }

  async end(): Promise<void> {
    this.inFlight = Math.max(0, this.inFlight - 1);
    await this.show();
  }

  private show(): Promise<void> {
    return this.badge.set(this.inFlight === 0 ? "" : String(this.inFlight));
  }
}

/** BadgeText over chrome.action (global badge, orange like the design's "loading" count). */
export class ChromeBadgeText implements BadgeText {
  async set(text: string): Promise<void> {
    await chrome.action.setBadgeText({ text });
    if (text !== "") await chrome.action.setBadgeBackgroundColor({ color: "#ff9500" });
  }
}
