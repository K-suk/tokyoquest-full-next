import { validateInput, validateFile, validateBase64 } from "./validation";
import { securityLogger } from "./logger";

// セキュリティテストクラス
export class SecurityTests {
  // XSSペイロードの検出
  static detectXSS(payload: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<form[^>]*>/gi,
      /<input[^>]*>/gi,
      /<textarea[^>]*>/gi,
      /<select[^>]*>/gi,
      /<button[^>]*>/gi,
      /<a[^>]*href\s*=\s*["']?javascript:/gi,
      /<img[^>]*on\w+\s*=/gi,
      /<svg[^>]*on\w+\s*=/gi,
      /<div[^>]*on\w+\s*=/gi,
      /<span[^>]*on\w+\s*=/gi,
      /<p[^>]*on\w+\s*=/gi,
      /<h[1-6][^>]*on\w+\s*=/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(payload));
  }

  // SQLインジェクションペイロードの検出
  static detectSQLInjection(payload: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(from|into|where|set|values)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(table|column|database|schema)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(user|password|admin|root)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(sys|information_schema|mysql|postgresql)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(version|user|database|schema)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(concat|substring|length|count|sum|avg|max|min)\b)/gi,
      /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(if|case|when|then|else|end)\b)/gi,
    ];

    return sqlPatterns.some((pattern) => pattern.test(payload));
  }

  // パストラバーサル攻撃の検出
  static detectPathTraversal(path: string): boolean {
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /\.\.%2F/gi,
      /\.\.%5C/gi,
      /\.\.%252f/gi,
      /\.\.%255c/gi,
      /\.\.%252F/gi,
      /\.\.%255C/gi,
      /\.\.%c0%af/gi,
      /\.\.%c1%9c/gi,
      /\.\.%c0%AF/gi,
      /\.\.%c1%9C/gi,
      /\.\.%e0%80%af/gi,
      /\.\.%e0%80%9c/gi,
      /\.\.%e0%80%AF/gi,
      /\.\.%e0%80%9C/gi,
      /\.\.%f0%80%80%af/gi,
      /\.\.%f0%80%80%9c/gi,
      /\.\.%f0%80%80%AF/gi,
      /\.\.%f0%80%80%9C/gi,
    ];

    return pathTraversalPatterns.some((pattern) => pattern.test(path));
  }

  // ファイルアップロードの検証
  static validateFileUpload(
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): boolean {
    try {
      validateFile(file, maxSize, allowedTypes);
      return true;
    } catch {
      return false;
    }
  }

  // Base64データの検証
  static validateBase64Data(data: string, maxSize: number): boolean {
    try {
      validateBase64(data, maxSize);
      return true;
    } catch {
      return false;
    }
  }

  // レート制限のテスト
  static testRateLimit(
    requests: number[],
    limit: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const recentRequests = requests.filter((time) => now - time < windowMs);
    return recentRequests.length <= limit;
  }

  // セッション固定化攻撃の検出
  static detectSessionFixation(
    sessionId: string,
    userAgent: string,
    ip: string
  ): boolean {
    // セッションIDの形式チェック
    const sessionPattern = /^[a-zA-Z0-9\-_]{20,}$/;
    if (!sessionPattern.test(sessionId)) {
      return true; // 疑わしいセッションID
    }

    // 短時間での複数セッション作成チェック
    // この実装は簡略化されており、実際の実装ではより詳細なチェックが必要
    return false;
  }

  // CSRF攻撃の検出
  static detectCSRF(
    origin: string | null,
    referer: string | null,
    allowedOrigins: string[]
  ): boolean {
    if (!origin && !referer) {
      return true; // OriginとRefererが両方ともない場合は疑わしい
    }

    if (origin && !allowedOrigins.includes(origin)) {
      return true; // 許可されていないOrigin
    }

    if (referer) {
      const refererUrl = new URL(referer);
      if (!allowedOrigins.includes(refererUrl.origin)) {
        return true; // 許可されていないReferer
      }
    }

    return false;
  }

  // 入力値のサニタイズ
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // < > を削除
      .replace(/javascript:/gi, "") // javascript: を削除
      .replace(/on\w+\s*=/gi, "") // イベントハンドラを削除
      .replace(/data:/gi, "") // data: を削除
      .replace(/vbscript:/gi, "") // vbscript: を削除
      .replace(/expression\s*\(/gi, "") // expression() を削除
      .trim();
  }

  // ファイル名のサニタイズ
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, "") // 危険な文字を削除
      .replace(/\.\./g, "") // パストラバーサルを防ぐ
      .replace(/^\.+/, "") // 先頭のドットを削除
      .replace(/\.+$/, "") // 末尾のドットを削除
      .substring(0, 255); // 長さ制限
  }

  // セキュリティヘッダーの検証
  static validateSecurityHeaders(headers: Record<string, string>): boolean {
    const requiredHeaders = [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
    ];

    return requiredHeaders.every((header) => headers[header] !== undefined);
  }

  // パスワード強度の検証
  static validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
}

// セキュリティテストの実行
export const runSecurityTests = {
  // 入力値のセキュリティテスト
  input: (input: string, ip: string, userAgent: string): boolean => {
    if (SecurityTests.detectXSS(input)) {
      securityLogger.logXssAttempt(ip, userAgent, input, "input-validation");
      return false;
    }

    if (SecurityTests.detectSQLInjection(input)) {
      securityLogger.logSqlInjectionAttempt(
        ip,
        userAgent,
        input,
        "input-validation"
      );
      return false;
    }

    return true;
  },

  // ファイルアップロードのセキュリティテスト
  fileUpload: (
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): boolean => {
    return SecurityTests.validateFileUpload(file, allowedTypes, maxSize);
  },

  // パスのセキュリティテスト
  path: (path: string, ip: string, userAgent: string): boolean => {
    if (SecurityTests.detectPathTraversal(path)) {
      securityLogger.logAnomalousRequest(
        ip,
        userAgent,
        "path-validation",
        "path_traversal",
        { path }
      );
      return false;
    }

    return true;
  },

  // CSRFのセキュリティテスト
  csrf: (
    origin: string | null,
    referer: string | null,
    allowedOrigins: string[]
  ): boolean => {
    return !SecurityTests.detectCSRF(origin, referer, allowedOrigins);
  },
};
