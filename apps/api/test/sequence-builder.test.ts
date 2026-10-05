import { describe, expect, test } from "bun:test";
import type { DecisionQuestion } from "../src/decisions/decision-question.ts";
import { buildSequence } from "../src/decisions/sequence-builder.ts";
import { FakeTokenizer } from "./fakes/fake-tokenizer.ts";

const limits = { maxLen: 512, headMaxLen: 192 };
const department: DecisionQuestion = {
  kind: "choice",
  instruction: "Which team",
  options: { billing: "invoices", other: "" },
};

describe("buildSequence", () => {
  test("lays out [CLS] head [SEP] [MASK] options [SEP] state [SEP] with a marker per option", () => {
    const tok = new FakeTokenizer();
    const { ids, markers } = buildSequence(tok, "charged twice", department, limits);
    const word = (w: string) => tok.idOf(w);
    expect(ids).toEqual([
      1,
      word("choice"),
      word("question:"),
      word("Which"),
      word("team"),
      2,
      3,
      word("billing:"),
      word("invoices"),
      3,
      word("other"),
      2,
      word("charged"),
      word("twice"),
      2,
    ]);
    expect(markers).toEqual([6, 9]);
  });

  test("strips literal mask tokens so input cannot forge an option marker", () => {
    const tok = new FakeTokenizer();
    const { ids } = buildSequence(tok, "a [MASK] b", { kind: "noul", instruction: "x" }, limits);
    expect(ids.filter((id) => id === tok.maskId)).toHaveLength(2);
  });

  test("clamps the state to maxLen and keeps the closing [SEP]", () => {
    const tok = new FakeTokenizer();
    const long = Array.from({ length: 50 }, (_, i) => `w${i}`).join(" ");
    const { ids } = buildSequence(tok, long, department, { maxLen: 30, headMaxLen: 192 });
    expect(ids).toHaveLength(30);
    expect(ids.at(-1)).toBe(tok.sepId);
  });

  test("caps each option at 48 tokens", () => {
    const tok = new FakeTokenizer();
    const description = Array.from({ length: 80 }, (_, i) => `d${i}`).join(" ");
    const { markers } = buildSequence(
      tok,
      "s",
      { kind: "choice", instruction: "q", options: { a: description, b: "" } },
      limits,
    );
    expect((markers[1] ?? 0) - (markers[0] ?? 0)).toBe(1 + 48);
  });

  test("shares the head budget equally when options overflow it", () => {
    const tok = new FakeTokenizer();
    const options = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`o${i}`, "x y z w v u"]));
    const { markers } = buildSequence(
      tok,
      "s",
      { kind: "choice", instruction: "q", options },
      { maxLen: 512, headMaxLen: 60 },
    );
    expect((markers[1] ?? 0) - (markers[0] ?? 0)).toBe(Math.floor((60 - 16) / 10));
  });

  test("renders score levels and noul labels", () => {
    const tok = new FakeTokenizer();
    const score = buildSequence(tok, "s", { kind: "score", instruction: "q", levels: ["low", "high"] }, limits);
    const noul = buildSequence(tok, "s", { kind: "noul", instruction: "q" }, limits);
    expect(score.markers).toHaveLength(2);
    expect(noul.ids).toContain(tok.idOf("false:"));
  });
});
