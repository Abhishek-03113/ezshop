import type { HighlightClock } from "../../src/popup/specs/group-highlight.ts";

/** A clock that only fires timers when the test calls `advance`, so highlight expiry is deterministic. */
export class FakeHighlightClock implements HighlightClock {
  private nextId = 1;
  private readonly pending = new Map<number, { dueAt: number; callback: () => void }>();
  private now = 0;

  setTimeout(callback: () => void, delayMs: number): number {
    const id = this.nextId++;
    this.pending.set(id, { dueAt: this.now + delayMs, callback });
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.pending.delete(handle as number);
  }

  advance(ms: number): void {
    this.now += ms;
    for (const [id, timer] of [...this.pending]) {
      if (timer.dueAt > this.now) continue;
      this.pending.delete(id);
      timer.callback();
    }
  }
}
