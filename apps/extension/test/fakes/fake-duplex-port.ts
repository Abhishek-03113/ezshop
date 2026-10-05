import type { DuplexPort } from "../../src/capture-protocol.ts";

/**
 * Both ends of a DuplexPort in one object: `sent` records what the code under test sent,
 * `deliver` / `close` play the other side.
 */
export class FakeDuplexPort<Sent, Received> implements DuplexPort<Sent, Received> {
  readonly sent: Sent[] = [];
  private readonly receivers: Array<(message: Received) => void> = [];
  private readonly closers: Array<() => void> = [];

  send(message: Sent): void {
    this.sent.push(message);
  }

  onReceive(listener: (message: Received) => void): void {
    this.receivers.push(listener);
  }

  onClose(listener: () => void): void {
    this.closers.push(listener);
  }

  deliver(message: Received): void {
    for (const receiver of this.receivers) receiver(message);
  }

  close(): void {
    for (const closer of this.closers) closer();
  }
}
