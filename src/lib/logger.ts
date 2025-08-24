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

// セキュリティ監視用ロガー
interface SecurityEvent {
  timestamp: string;
  event: string;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  log(event: Omit<SecurityEvent, "timestamp">) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.events.push(securityEvent);

    // 最大数を超えたら古いイベントを削除
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // 重要度に応じて通常ロガーにも出力
    const logMethod =
      event.severity === "critical" || event.severity === "high"
        ? "error"
        : event.severity === "medium"
        ? "warn"
        : "info";

    logger[logMethod](`[SECURITY] ${event.event}`, {
      severity: event.severity,
      details: this.sanitizeSecurityDetails(event.details),
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId,
    });
  }

  private sanitizeSecurityDetails(
    details: Record<string, any>
  ): Record<string, any> {
    const sensitiveKeys = [
      "password",
      "secret",
      "token",
      "key",
      "credential",
      "input",
      "email",
      "phone",
      "address",
      "credit_card",
      "ssn",
      "api_key",
      "private_key",
      "session_id",
      "auth_token",
      "refresh_token",
      "access_token",
      "client_secret",
      "database_url",
      "connection_string",
      "encryption_key",
      "signing_key",
      "jwt_secret",
      "oauth_secret",
      "webhook_secret",
      "api_secret",
      "master_key",
      "admin_password",
      "root_password",
      "sudo_password",
    ];
    const result = { ...details };

    sensitiveKeys.forEach((key) => {
      if (key in result) {
        result[key] = "[REDACTED]";
      }
    });

    // ネストされたオブジェクトも再帰的に処理
    Object.keys(result).forEach((key) => {
      if (typeof result[key] === "object" && result[key] !== null) {
        result[key] = this.sanitizeSecurityDetails(result[key]);
      }
    });

    return result;
  }

  // レート制限違反のログ
  logRateLimit(ip: string, userAgent: string, endpoint: string) {
    this.log({
      event: "RATE_LIMIT_EXCEEDED",
      severity: "medium",
      details: { endpoint },
      ip,
      userAgent,
    });
  }

  // 認証失敗のログ
  logAuthFailure(ip: string, userAgent: string, reason: string) {
    this.log({
      event: "AUTHENTICATION_FAILED",
      severity: "high",
      details: { reason },
      ip,
      userAgent,
    });
  }

  // 不正なファイルアップロードのログ
  logFileUploadViolation(
    ip: string,
    userAgent: string,
    fileName: string,
    violation: string
  ) {
    this.log({
      event: "FILE_UPLOAD_VIOLATION",
      severity: "high",
      details: { fileName, violation },
      ip,
      userAgent,
    });
  }

  // 統計情報の取得
  getStats() {
    const stats = {
      total: this.events.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byEvent: {} as Record<string, number>,
    };

    this.events.forEach((event) => {
      stats.bySeverity[event.severity]++;
      stats.byEvent[event.event] = (stats.byEvent[event.event] || 0) + 1;
    });

    return stats;
  }
}

// グローバルセキュリティロガー
export const securityLogger = new SecurityLogger();
