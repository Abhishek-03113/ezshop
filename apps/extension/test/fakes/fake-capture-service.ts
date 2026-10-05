import type { ActiveTab } from "../../src/capture-flow.ts";
import type { CaptureOutcome, CapturePhase } from "../../src/capture-outcome.ts";
import type { CaptureService } from "../../src/popup/capture-service.ts";

/** CaptureService that reports the given phases, then returns a canned outcome (or rejects). */
export class FakeCaptureService implements CaptureService {
  readonly requestedTabs: ActiveTab[] = [];

  constructor(
    private readonly outcome: CaptureOutcome | Error,
    private readonly phases: readonly CapturePhase[] = ["reading", "saving"],
  ) {}

  async capture(tab: ActiveTab, onProgress: (phase: CapturePhase) => void): Promise<CaptureOutcome> {
    this.requestedTabs.push(tab);
    for (const phase of this.phases) onProgress(phase);
    if (this.outcome instanceof Error) throw this.outcome;
    return this.outcome;
  }
}
