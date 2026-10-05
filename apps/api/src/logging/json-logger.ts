export type LogFields = Readonly<Record<string, string | number | boolean | null>>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

type LineWriter = (line: string) => void;

/**
 * Logger that writes one JSON object per line, for observability tooling.
 *
 * @example createJsonLogger(console.log, () => new Date()).info("product.saved", { id })
 */
export function createJsonLogger(writeLine: LineWriter, now: () => Date): Logger {
  const write = (level: string, event: string, fields: LogFields = {}) =>
    writeLine(JSON.stringify({ time: now().toISOString(), level, event, ...fields }));
  return {
    info: (event, fields) => write("info", event, fields),
    error: (event, fields) => write("error", event, fields),
  };
}
