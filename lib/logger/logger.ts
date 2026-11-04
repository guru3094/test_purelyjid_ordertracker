import { getCorrelationId } from "@/lib/context/correlationContext";

export type LogLevel =
  | "INFO"
  | "WARN"
  | "ERROR";

class Logger {
  log(
    level: LogLevel,
    service: string,
    message: string,
    metadata?: unknown
  ) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        correlationId: getCorrelationId(),
        level,
        service,
        message,
        metadata,
      })
    );
  }

  info(
    service: string,
    message: string,
    metadata?: unknown
  ) {
    this.log(
      "INFO",
      service,
      message,
      metadata
    );
  }

  warn(
    service: string,
    message: string,
    metadata?: unknown
  ) {
    this.log(
      "WARN",
      service,
      message,
      metadata
    );
  }

  error(
    service: string,
    message: string,
    metadata?: unknown
  ) {
    this.log(
      "ERROR",
      service,
      message,
      metadata
    );
  }
}

export const logger = new Logger();
