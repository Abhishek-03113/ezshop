import type { LogFields, Logger } from "../../src/logging/json-logger.ts";

export interface RecordedLogEntry {
  level: "info" | "error";
  event: string;
  fields: LogFields;
}

/** Logger that keeps entries in memory for assertions. */
export class RecordingLogger implements Logger {
  readonly entries: RecordedLogEntry[] = [];

  info(event: string, fields: LogFields = {}): void {
    this.entries.push({ level: "info", event, fields });
  }

  error(event: string, fields: LogFields = {}): void {
    this.entries.push({ level: "error", event, fields });
  }
}
