import { ConsoleLogger, Injectable, type LogLevel } from "@nestjs/common";

type LogPayload = Record<string, unknown>;

@Injectable()
export class JsonLogger extends ConsoleLogger {
  private write(level: LogLevel, message: unknown, context?: string, payload?: LogPayload): void {
    const entry = {
      level,
      context,
      message: typeof message === "string" ? message : JSON.stringify(message),
      timestamp: new Date().toISOString(),
      ...payload,
    };

    const line = JSON.stringify(entry);
    if (level === "error") {
      process.stderr.write(`${line}\n`);
      return;
    }

    process.stdout.write(`${line}\n`);
  }

  override log(message: unknown, context?: string): void {
    this.write("log", message, context);
  }

  override error(message: unknown, stack?: string, context?: string): void {
    this.write("error", message, context, { stack });
  }

  override warn(message: unknown, context?: string): void {
    this.write("warn", message, context);
  }

  override debug(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }

  override verbose(message: unknown, context?: string): void {
    this.write("verbose", message, context);
  }
}
