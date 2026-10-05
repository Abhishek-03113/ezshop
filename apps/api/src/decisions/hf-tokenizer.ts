import { AutoTokenizer, env } from "@huggingface/transformers";
import { basename, dirname } from "node:path";
import { z } from "zod";
import type { TokenizerPort } from "./tokenizer-port.ts";

const TokenizerFileSchema = z.object({
  added_tokens: z.array(z.object({ id: z.number().int(), content: z.string() })),
});

/** TokenizerPort over @huggingface/transformers, reading tokenizer.json from a local model directory. */
export async function loadHfTokenizer(modelDir: string): Promise<TokenizerPort> {
  const specialIds = await readSpecialIds(`${modelDir}/tokenizer.json`);
  // transformers.js resolves models relative to a global root; pin it to the model's parent
  // and forbid downloads so a typo in DECISION_MODEL_DIR fails instead of fetching from the Hub.
  env.allowRemoteModels = false;
  env.localModelPath = `${dirname(modelDir)}/`;
  const tokenizer = await AutoTokenizer.from_pretrained(basename(modelDir));
  return {
    ...specialIds,
    maskToken: "[MASK]",
    encode: (text, maxTokens) => {
      const ids = Array.from(tokenizer.encode(text, { add_special_tokens: false }), Number);
      return maxTokens === undefined ? ids : ids.slice(0, maxTokens);
    },
  };
}

async function readSpecialIds(path: string): Promise<Pick<TokenizerPort, "clsId" | "sepId" | "maskId">> {
  const { added_tokens } = TokenizerFileSchema.parse(await Bun.file(path).json());
  const idOf = (content: string): number => {
    const found = added_tokens.find((token) => token.content === content);
    if (found) return found.id;
    throw new Error(`${path} has no added token "${content}"; expected a ModernBERT-style tokenizer.json`);
  };
  return { clsId: idOf("[CLS]"), sepId: idOf("[SEP]"), maskId: idOf("[MASK]") };
}
