import { Hono, type Context } from "hono";
import { z } from "zod";
import type { DecisionModel } from "../decisions/decision-model.ts";
import type { Logger } from "../logging/json-logger.ts";
import { BadRequestError } from "./http-errors.ts";

export interface DecisionRouteDependencies {
  decisionModel: DecisionModel;
  logger: Logger;
}

const instruction = z.string().min(1);
const QuestionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), instruction, options: z.record(z.string(), z.string()) }),
  z.object({ kind: z.literal("score"), instruction, levels: z.array(z.string()).min(2) }),
  z.object({ kind: z.literal("noul"), instruction }),
]);
const DecideRequestSchema = z.object({ state: z.string().min(1), question: QuestionSchema });

/**
 * POST /decisions: score one typed question over a text with the local Laya model.
 *
 * @example POST /api/decisions {"state": "...", "question": {"kind": "noul", "instruction": "Is it refurbished?"}}
 */
export function createDecisionRoutes(deps: DecisionRouteDependencies): Hono {
  return new Hono().post("/decisions", (c) => decide(c, deps));
}

async function decide(c: Context, deps: DecisionRouteDependencies): Promise<Response> {
  const { state, question } = parseDecideRequest(await readBody(c));
  if (question.kind === "choice" && Object.keys(question.options).length < 2) {
    throw new BadRequestError(
      `Choice question has ${Object.keys(question.options).length} options; expected at least 2`,
    );
  }
  const answer = await deps.decisionModel.decide(state, question);
  deps.logger.info("decision.made", { kind: question.kind, label: answer.label, probability: answer.probability });
  return c.json({ answer });
}

async function readBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequestError(
      `Request body for ${c.req.method} ${c.req.path} is not valid JSON; expected a JSON object`,
    );
  }
}

function parseDecideRequest(body: unknown): z.infer<typeof DecideRequestSchema> {
  const parsed = DecideRequestSchema.safeParse(body);
  if (parsed.success) return parsed.data;
  throw new BadRequestError(
    `Decision body is invalid (${parsed.error.message}); expected {"state": string, "question": {"kind": "choice"|"score"|"noul", "instruction": string, ...}}`,
  );
}
