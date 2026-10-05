import type { KeyValueStorage } from "../../src/settings.ts";

/** In-memory KeyValueStorage; seed it to simulate earlier sessions. */
export class FakeKeyValueStorage implements KeyValueStorage {
  private readonly entries = new Map<string, unknown>();

  constructor(seed: Readonly<Record<string, unknown>> = {}) {
    for (const [key, value] of Object.entries(seed)) this.entries.set(key, value);
  }

  async read(key: string): Promise<unknown> {
    return this.entries.get(key);
  }

  async write(key: string, value: unknown): Promise<void> {
    this.entries.set(key, value);
  }
}
