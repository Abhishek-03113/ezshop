import type { TokenizerPort } from "../../src/decisions/tokenizer-port.ts";

/** Whitespace tokenizer: each distinct word gets a stable id from 100 up, specials are 1-3. */
export class FakeTokenizer implements TokenizerPort {
  readonly clsId = 1;
  readonly sepId = 2;
  readonly maskId = 3;
  readonly maskToken = "[MASK]";
  private readonly wordIds = new Map<string, number>();

  encode(text: string, maxTokens?: number): number[] {
    const ids = text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => this.idOf(word));
    return maxTokens === undefined ? ids : ids.slice(0, maxTokens);
  }

  idOf(word: string): number {
    const known = this.wordIds.get(word);
    if (known !== undefined) return known;
    const id = 100 + this.wordIds.size;
    this.wordIds.set(word, id);
    return id;
  }
}
