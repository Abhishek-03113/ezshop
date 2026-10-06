/** Timer functions the highlighter schedules with; injectable so tests need no real clock. */
export interface HighlightClock {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

const REAL_CLOCK: HighlightClock = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export const HIGHLIGHT_MS = 2000;

/**
 * Marks one chip and its spec group as "the one you just jumped to", then clears both after a moment.
 * Only one pair is marked at a time: picking another chip moves the mark and restarts the timer.
 *
 * @example const highlighter = new GroupHighlighter(); highlighter.show(chip, section)
 */
export class GroupHighlighter {
  private marked: { chip: HTMLElement; section: HTMLElement } | null = null;
  private timer: unknown = null;

  constructor(
    private readonly clock: HighlightClock = REAL_CLOCK,
    private readonly durationMs: number = HIGHLIGHT_MS,
  ) {}

  show(chip: HTMLElement, section: HTMLElement): void {
    this.clear();
    chip.setAttribute("aria-current", "true");
    section.classList.add("highlighted");
    this.marked = { chip, section };
    this.timer = this.clock.setTimeout(() => this.clear(), this.durationMs);
  }

  clear(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer);
    this.timer = null;
    this.marked?.chip.removeAttribute("aria-current");
    this.marked?.section.classList.remove("highlighted");
    this.marked = null;
  }
}
