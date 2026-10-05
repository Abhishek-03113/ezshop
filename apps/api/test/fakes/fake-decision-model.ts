import type { DecisionAnswer, DecisionModel } from "../../src/decisions/decision-model.ts";
import type { DecisionQuestion } from "../../src/decisions/decision-question.ts";

/** DecisionModel that always answers with a fixed answer and records the questions asked. */
export class FakeDecisionModel implements DecisionModel {
  readonly asked: { state: string; question: DecisionQuestion }[] = [];

  constructor(private readonly answer: DecisionAnswer) {}

  async decide(state: string, question: DecisionQuestion): Promise<DecisionAnswer> {
    this.asked.push({ state, question });
    return this.answer;
  }
}
