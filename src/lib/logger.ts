// 構造化ログ出力
export interface LogLevel {
  ERROR: "error";
  WARN: "warn";
  INFO: "info";
  DEBUG: "debug";
}

export const LOG_LEVELS: LogLevel = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatLog(
    level: string,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: this.isDevelopment ? error.stack : undefined,
          }
        : undefined,
    };
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // 開発環境ではコンソールに出力
      const logMethod =
        entry.level === "error"
          ? "error"
          : entry.level === "warn"
          ? "warn"
          : entry.level === "info"
          ? "info"
          : "log";

      console[logMethod](
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
        {
          context: entry.context,
          error: entry.error,
        }
      );
    } else {
      // 本番環境では構造化ログとして出力
      console.log(JSON.stringify(entry));
    }
  }

  error(
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    this.output(this.formatLog(LOG_LEVELS.ERROR, message, context, error));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatLog(LOG_LEVELS.WARN, message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatLog(LOG_LEVELS.INFO, message, context));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      this.output(this.formatLog(LOG_LEVELS.DEBUG, message, context));
    }
  }
}

export const logger = new Logger();
