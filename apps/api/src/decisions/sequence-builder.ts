import { renderOptions, type DecisionQuestion } from "./decision-question.ts";
import type { TokenizerPort } from "./tokenizer-port.ts";

export interface SequenceLimits {
  maxLen: number;
  headMaxLen: number;
}

export interface BuiltSequence {
  ids: number[];
  /** Index of each option's [MASK] token in `ids`, in option order. */
  markers: number[];
}

const MAX_OPTION_TOKENS = 48;
const MIN_HEAD_TOKENS = 8;
const MIN_OPTION_BUDGET = 16;
const MIN_TOKENS_PER_OPTION = 4;

/**
 * Port of laya.common.build_sequence:
 * `[CLS] <type> question: <instruction> [SEP] [MASK] opt0 [MASK] opt1 ... [SEP] state [SEP]`.
 * The head (question + options) is budgeted first and the state fills what is left of `maxLen`.
 *
 * @example buildSequence(tokenizer, "charged twice", question, { maxLen: 512, headMaxLen: 192 })
 */
export function buildSequence(
  tokenizer: TokenizerPort,
  state: string,
  question: DecisionQuestion,
  limits: SequenceLimits,
): BuiltSequence {
  const head = buildHead(tokenizer, question, limits.headMaxLen);
  const room = Math.max(0, limits.maxLen - head.ids.length - 1);
  const stateIds = tokenizer.encode(stripMask(state, tokenizer)).slice(0, room);
  const ids = [...head.ids, ...stateIds, tokenizer.sepId].slice(0, limits.maxLen);
  return { ids, markers: head.markers.filter((marker) => marker < limits.maxLen) };
}

function buildHead(tokenizer: TokenizerPort, question: DecisionQuestion, headMaxLen: number): BuiltSequence {
  const instructionIds = tokenizer.encode(`${question.kind} question: ${stripMask(question.instruction, tokenizer)}`);
  const spans = capOptionSpans(optionSpans(tokenizer, question), headMaxLen);
  const instructionRoom = Math.max(MIN_HEAD_TOKENS, headMaxLen - totalLength(spans));
  const ids = [tokenizer.clsId, ...instructionIds.slice(0, instructionRoom), tokenizer.sepId];
  const markers: number[] = [];
  for (const span of spans) {
    markers.push(ids.length);
    ids.push(...span);
  }
  ids.push(tokenizer.sepId);
  return { ids, markers };
}

function optionSpans(tokenizer: TokenizerPort, question: DecisionQuestion): number[][] {
  return renderOptions(question).map((text) => [
    tokenizer.maskId,
    ...tokenizer.encode(` ${stripMask(text, tokenizer)}`, MAX_OPTION_TOKENS),
  ]);
}

// Many long options would crowd out the instruction, so they are cut to an equal share.
function capOptionSpans(spans: number[][], headMaxLen: number): number[][] {
  if (headMaxLen - totalLength(spans) >= MIN_OPTION_BUDGET) return spans;
  const share = Math.max(
    MIN_TOKENS_PER_OPTION,
    Math.floor((headMaxLen - MIN_OPTION_BUDGET) / Math.max(1, spans.length)),
  );
  return spans.map((span) => span.slice(0, share));
}

const totalLength = (spans: readonly number[][]): number => spans.reduce((sum, span) => sum + span.length, 0);

const stripMask = (text: string, tokenizer: TokenizerPort): string => text.replaceAll(tokenizer.maskToken, " ");
