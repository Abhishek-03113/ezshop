/** Minimal tokenizer surface Laya needs, so the third-party tokenizer stays behind one adapter. */
export interface TokenizerPort {
  readonly clsId: number;
  readonly sepId: number;
  readonly maskId: number;
  /** Literal mask text, stripped from user input so it cannot forge an option marker. */
  readonly maskToken: string;
  /** Token ids for `text` with no special tokens added, keeping at most `maxTokens` (the first ones). */
  encode(text: string, maxTokens?: number): number[];
}
