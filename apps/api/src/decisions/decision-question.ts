/** A question Laya scores in one forward pass. `noul` is Laya's name for a yes/no question. */
export type DecisionQuestion = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export interface ChoiceQuestion {
  kind: "choice";
  instruction: string;
  /** label -> description; an empty description means the label speaks for itself. */
  options: Readonly<Record<string, string>>;
}

export interface ScoreQuestion {
  kind: "score";
  instruction: string;
  /** Ordinal scale, lowest first; the answer label is the level's index as a string. */
  levels: readonly string[];
}

export interface NoulQuestion {
  kind: "noul";
  instruction: string;
}

export type QuestionKind = DecisionQuestion["kind"];

/** The qtype input the exported graph expects (laya.common.QTYPES). */
export const MODEL_TYPE_ID: Readonly<Record<QuestionKind, number>> = { choice: 0, score: 1, noul: 2 };

const NOUL_OPTIONS: readonly string[] = ["false: no, the statement does not hold", "true: yes, the statement holds"];

/** Option texts in label order, exactly as laya.common.render_options writes them. */
export function renderOptions(question: DecisionQuestion): string[] {
  switch (question.kind) {
    case "choice":
      return Object.entries(question.options).map(([label, description]) =>
        description === "" ? label : `${label}: ${description}`,
      );
    case "score":
      return question.levels.map((criterion, index) => `level ${index}: ${criterion}`);
    case "noul":
      return [...NOUL_OPTIONS];
  }
}

/** Labels an answer can carry, aligned with `renderOptions`. */
export function answerLabels(question: DecisionQuestion): string[] {
  switch (question.kind) {
    case "choice":
      return Object.keys(question.options);
    case "score":
      return question.levels.map((_, index) => String(index));
    case "noul":
      return ["false", "true"];
  }
}
