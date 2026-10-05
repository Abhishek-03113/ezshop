import type { FixtureFiles } from "../../src/testing/fixture-files.ts";

/** FixtureFiles held in a Map, keyed by relative path. */
export class InMemoryFixtureFiles implements FixtureFiles {
  readonly textByPath = new Map<string, string>();

  async listFiles(): Promise<string[]> {
    return [...this.textByPath.keys()].sort();
  }

  async readText(path: string): Promise<string> {
    const text = this.textByPath.get(path);
    if (text === undefined) throw new Error(`InMemoryFixtureFiles has no file "${path}"`);
    return text;
  }

  async writeText(path: string, text: string): Promise<void> {
    this.textByPath.set(path, text);
  }
}
