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
    // 包括的な機密情報キーワードリスト
    const sensitiveKeys = [
      // 認証関連
      "password",
      "passwd",
      "pwd",
      "secret",
      "token",
      "key",
      "credential",
      "auth",
      "authentication",
      "authorization",
      "login",
      "signin",

      // API関連
      "api_key",
      "api_secret",
      "api_token",
      "client_secret",
      "client_id",
      "oauth_secret",
      "oauth_token",
      "access_token",
      "refresh_token",
      "bearer_token",
      "jwt_token",
      "session_token",

      // データベース関連
      "database_url",
      "db_url",
      "connection_string",
      "connection_url",
      "datasource",
      "dsn",
      "connection",
      "conn_string",

      // 暗号化関連
      "encryption_key",
      "encrypt_key",
      "signing_key",
      "sign_key",
      "private_key",
      "public_key",
      "certificate",
      "cert",
      "ssl_key",

      // 個人情報
      "email",
      "phone",
      "telephone",
      "mobile",
      "address",
      "street",
      "city",
      "state",
      "zip",
      "postal",
      "country",
      "ssn",
      "social_security",
      "credit_card",
      "card_number",
      "cvv",
      "cvc",
      "expiry",
      "expiration",
      "birth_date",
      "birthday",
      "dob",
      "age",
      "gender",
      "nationality",

      // 金融関連
      "bank_account",
      "account_number",
      "routing_number",
      "iban",
      "swift",
      "credit_score",
      "income",
      "salary",
      "balance",
      "amount",

      // システム関連
      "admin_password",
      "root_password",
      "sudo_password",
      "master_key",
      "superuser",
      "administrator",
      "system_password",
      "service_account",

      // 外部サービス
      "webhook_secret",
      "webhook_token",
      "callback_url",
      "redirect_uri",
      "endpoint",
      "base_url",
      "host",
      "domain",
      "subdomain",

      // その他の機密情報
      "input",
      "user_input",
      "form_data",
      "request_body",
      "payload",
      "data",
      "content",
      "body",
      "params",
      "query",
      "headers",
      "cookie",
      "session",
      "session_id",
      "user_id",
      "customer_id",
      "account_id",
      "transaction_id",
      "order_id",
      "invoice_id",

      // 環境変数関連
      "env",
      "environment",
      "config",
      "configuration",
      "setting",
      "variable",
      "var",
      "param",
      "parameter",
    ];

    // 機密情報パターン（正規表現）
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /credential/i,
      /auth/i,
      /api[_-]?key/i,
      /client[_-]?secret/i,
      /oauth[_-]?secret/i,
      /access[_-]?token/i,
      /refresh[_-]?token/i,
      /bearer[_-]?token/i,
      /jwt[_-]?token/i,
      /session[_-]?token/i,
      /database[_-]?url/i,
      /connection[_-]?string/i,
      /encryption[_-]?key/i,
      /signing[_-]?key/i,
      /private[_-]?key/i,
      /public[_-]?key/i,
      /certificate/i,
      /ssl[_-]?key/i,
      /credit[_-]?card/i,
      /card[_-]?number/i,
      /bank[_-]?account/i,
      /account[_-]?number/i,
      /routing[_-]?number/i,
      /social[_-]?security/i,
      /webhook[_-]?secret/i,
      /callback[_-]?url/i,
      /redirect[_-]?uri/i,
    ];

    const result = { ...details };

    // 1. 直接的なキー名でのマスキング
    sensitiveKeys.forEach((key) => {
      if (key in result) {
        result[key] = "[REDACTED]";
      }
    });

    // 2. パターンマッチングでのマスキング
    Object.keys(result).forEach((key) => {
      if (sensitivePatterns.some((pattern) => pattern.test(key))) {
        result[key] = "[REDACTED]";
      }
    });

    // 3. 値の内容によるマスキング（機密情報らしい値）
    Object.keys(result).forEach((key) => {
      const value = result[key];
      if (typeof value === "string") {
        // 長いランダム文字列（トークンやシークレットの可能性）
        if (value.length > 20 && /^[A-Za-z0-9+/=_-]+$/.test(value)) {
          result[key] = "[REDACTED]";
        }
        // メールアドレス
        else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          result[key] = "[EMAIL_REDACTED]";
        }
        // 電話番号
        else if (/^[\+]?[0-9\s\-\(\)]{10,}$/.test(value)) {
          result[key] = "[PHONE_REDACTED]";
        }
        // クレジットカード番号
        else if (/^[0-9\s\-]{13,19}$/.test(value)) {
          result[key] = "[CARD_REDACTED]";
        }
        // URL（機密情報を含む可能性）
        else if (
          value.includes("://") &&
          (value.includes("password") ||
            value.includes("secret") ||
            value.includes("token") ||
            value.includes("key"))
        ) {
          result[key] = "[URL_REDACTED]";
        }
      }
    });

    // 4. ネストされたオブジェクトの再帰的処理
    Object.keys(result).forEach((key) => {
      if (typeof result[key] === "object" && result[key] !== null) {
        if (Array.isArray(result[key])) {
          // 配列の場合、各要素を処理
          result[key] = result[key].map((item: any) => {
            if (typeof item === "object" && item !== null) {
              return this.sanitizeSecurityDetails(item);
            }
            return item;
          });
        } else {
          // オブジェクトの場合、再帰的に処理
          result[key] = this.sanitizeSecurityDetails(result[key]);
        }
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

  // SQLインジェクション攻撃のログ
  logSqlInjectionAttempt(
    ip: string,
    userAgent: string,
    input: string,
    endpoint: string
  ) {
    this.log({
      event: "SQL_INJECTION_ATTEMPT",
      severity: "critical",
      details: {
        input: this.sanitizeInput(input),
        endpoint,
      },
      ip,
      userAgent,
    });
  }

  // XSS攻撃のログ
  logXssAttempt(
    ip: string,
    userAgent: string,
    input: string,
    endpoint: string
  ) {
    this.log({
      event: "XSS_ATTEMPT",
      severity: "high",
      details: {
        input: this.sanitizeInput(input),
        endpoint,
      },
      ip,
      userAgent,
    });
  }

  // 不正なアクセス試行のログ
  logUnauthorizedAccess(
    ip: string,
    userAgent: string,
    endpoint: string,
    reason: string
  ) {
    this.log({
      event: "UNAUTHORIZED_ACCESS",
      severity: "medium",
      details: { endpoint, reason },
      ip,
      userAgent,
    });
  }

  // 異常なリクエストパターンのログ
  logAnomalousRequest(
    ip: string,
    userAgent: string,
    endpoint: string,
    pattern: string,
    details: Record<string, any>
  ) {
    this.log({
      event: "ANOMALOUS_REQUEST",
      severity: "medium",
      details: {
        endpoint,
        pattern,
        ...this.sanitizeSecurityDetails(details),
      },
      ip,
      userAgent,
    });
  }

  // セッション関連のセキュリティイベント
  logSessionSecurityEvent(
    ip: string,
    userAgent: string,
    userId: string,
    event: string,
    details: Record<string, any>
  ) {
    this.log({
      event: `SESSION_${event.toUpperCase()}`,
      severity: "medium",
      details: {
        userId: this.maskUserId(userId),
        ...this.sanitizeSecurityDetails(details),
      },
      ip,
      userAgent,
      userId: this.maskUserId(userId),
    });
  }

  // 入力値のサニタイズ（機密情報を除去）
  private sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") {
      return "[INVALID_INPUT]";
    }

    // 機密情報パターンを検出してマスキング
    let sanitized = input;

    // メールアドレス
    sanitized = sanitized.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[EMAIL]"
    );

    // 電話番号
    sanitized = sanitized.replace(/[\+]?[0-9\s\-\(\)]{10,}/g, "[PHONE]");

    // クレジットカード番号
    sanitized = sanitized.replace(/[0-9\s\-]{13,19}/g, "[CARD]");

    // 長いランダム文字列（トークンやシークレット）
    sanitized = sanitized.replace(/[A-Za-z0-9+/=_-]{20,}/g, "[TOKEN]");

    // SQLインジェクションの可能性がある文字列
    if (/['";]/.test(sanitized)) {
      sanitized = sanitized.replace(/['";]/g, "[SPECIAL_CHAR]");
    }

    // XSSの可能性がある文字列
    if (/[<>]/.test(sanitized)) {
      sanitized = sanitized.replace(/[<>]/g, "[HTML_TAG]");
    }

    return sanitized;
  }

  // ユーザーIDのマスキング
  private maskUserId(userId: string): string {
    if (!userId || typeof userId !== "string") {
      return "[UNKNOWN_USER]";
    }

    if (userId.length <= 4) {
      return "[USER]";
    }

    return `${userId.substring(0, 2)}***${userId.substring(userId.length - 2)}`;
  }

  // 統計情報の取得
  getStats() {
    const stats = {
      total: this.events.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byEvent: {} as Record<string, number>,
      recentEvents: [] as SecurityEvent[],
      threatLevel: "low" as "low" | "medium" | "high" | "critical",
    };

    this.events.forEach((event) => {
      stats.bySeverity[event.severity]++;
      stats.byEvent[event.event] = (stats.byEvent[event.event] || 0) + 1;
    });

    // 最近のイベント（最後の10件）
    stats.recentEvents = this.events.slice(-10);

    // 脅威レベルの判定
    const criticalCount = stats.bySeverity.critical;
    const highCount = stats.bySeverity.high;
    const mediumCount = stats.bySeverity.medium;

    if (criticalCount > 0) {
      stats.threatLevel = "critical";
    } else if (highCount > 5) {
      stats.threatLevel = "high";
    } else if (highCount > 0 || mediumCount > 10) {
      stats.threatLevel = "medium";
    }

    return stats;
  }

  // セキュリティアラートの生成
  generateAlerts(): Array<{
    level: "low" | "medium" | "high" | "critical";
    message: string;
    count: number;
    timestamp: string;
  }> {
    const alerts: Array<{
      level: "low" | "medium" | "high" | "critical";
      message: string;
      count: number;
      timestamp: string;
    }> = [];

    const stats = this.getStats();
    const now = new Date().toISOString();

    // Critical レベルのアラート
    if (stats.bySeverity.critical > 0) {
      alerts.push({
        level: "critical",
        message: `Critical security events detected: ${stats.bySeverity.critical} events`,
        count: stats.bySeverity.critical,
        timestamp: now,
      });
    }

    // High レベルのアラート
    if (stats.bySeverity.high > 5) {
      alerts.push({
        level: "high",
        message: `High security events threshold exceeded: ${stats.bySeverity.high} events`,
        count: stats.bySeverity.high,
        timestamp: now,
      });
    }

    // Rate Limit 違反のアラート
    const rateLimitEvents = stats.byEvent["RATE_LIMIT_EXCEEDED"] || 0;
    if (rateLimitEvents > 10) {
      alerts.push({
        level: "medium",
        message: `Rate limit violations detected: ${rateLimitEvents} events`,
        count: rateLimitEvents,
        timestamp: now,
      });
    }

    // 認証失敗のアラート
    const authFailures = stats.byEvent["AUTHENTICATION_FAILED"] || 0;
    if (authFailures > 5) {
      alerts.push({
        level: "high",
        message: `Authentication failures detected: ${authFailures} events`,
        count: authFailures,
        timestamp: now,
      });
    }

    // SQLインジェクション試行のアラート
    const sqlInjectionAttempts = stats.byEvent["SQL_INJECTION_ATTEMPT"] || 0;
    if (sqlInjectionAttempts > 0) {
      alerts.push({
        level: "critical",
        message: `SQL injection attempts detected: ${sqlInjectionAttempts} events`,
        count: sqlInjectionAttempts,
        timestamp: now,
      });
    }

    // XSS攻撃試行のアラート
    const xssAttempts = stats.byEvent["XSS_ATTEMPT"] || 0;
    if (xssAttempts > 0) {
      alerts.push({
        level: "high",
        message: `XSS attempts detected: ${xssAttempts} events`,
        count: xssAttempts,
        timestamp: now,
      });
    }

    return alerts;
  }

  // セキュリティレポートの生成
  generateSecurityReport(): {
    summary: string;
    threatLevel: string;
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    alerts: Array<{
      level: string;
      message: string;
      count: number;
    }>;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const alerts = this.generateAlerts();

    const recommendations: string[] = [];

    if (stats.threatLevel === "critical") {
      recommendations.push("Immediate security review required");
      recommendations.push(
        "Consider implementing additional security measures"
      );
      recommendations.push("Review and update security policies");
    } else if (stats.threatLevel === "high") {
      recommendations.push("Enhanced monitoring recommended");
      recommendations.push("Review recent security events");
      recommendations.push("Consider rate limiting adjustments");
    } else if (stats.threatLevel === "medium") {
      recommendations.push("Monitor for escalation");
      recommendations.push("Review security logs regularly");
    }

    return {
      summary: `Security report generated at ${new Date().toISOString()}`,
      threatLevel: stats.threatLevel,
      totalEvents: stats.total,
      criticalEvents: stats.bySeverity.critical,
      highEvents: stats.bySeverity.high,
      alerts: alerts.map((alert) => ({
        level: alert.level,
        message: alert.message,
        count: alert.count,
      })),
      recommendations,
    };
  }
}

// グローバルセキュリティロガー
export const securityLogger = new SecurityLogger();
