import type { Context } from "hono";
import { BadRequestError } from "./http-errors.ts";

/**
 * Parses the request body as JSON, or throws a 400 naming the route.
 *
 * @example const body = await readJsonBody(c)
 */
export async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequestError(
      `Request body for ${c.req.method} ${c.req.path} is not valid JSON; expected a JSON object`,
    );
  }
}
