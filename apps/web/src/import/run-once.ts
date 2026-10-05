/**
 * Runs an action at most once. Guards the `?import=` auto-start against React StrictMode's double effect
 * and re-renders, which would otherwise POST the same URL twice.
 *
 * @example const guard = new RunOnce(); guard.run(start); guard.run(start); // start called once
 */
export class RunOnce {
  private hasRun = false;

  run(action: () => void): void {
    if (this.hasRun) return;
    this.hasRun = true;
    action();
  }
}
