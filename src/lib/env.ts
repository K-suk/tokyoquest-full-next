// 環境変数の検証
export function validateEnv() {
  const requiredEnvVars = [
    "DATABASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  // 環境変数の型と形式の厳格な検証
  const envValidation = {
    DATABASE_URL: {
      value: process.env.DATABASE_URL!,
      pattern: /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/,
      message: "DATABASE_URL must be a valid PostgreSQL connection string",
    },
    GOOGLE_CLIENT_ID: {
      value: process.env.GOOGLE_CLIENT_ID!,
      pattern: /^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/,
      message: "GOOGLE_CLIENT_ID must be a valid Google OAuth client ID",
    },
    GOOGLE_CLIENT_SECRET: {
      value: process.env.GOOGLE_CLIENT_SECRET!,
      minLength: 24,
      message: "GOOGLE_CLIENT_SECRET must be at least 24 characters long",
    },
    NEXTAUTH_SECRET: {
      value: process.env.NEXTAUTH_SECRET!,
      minLength: 32,
      pattern: /^[A-Za-z0-9+/=]{32,}$/,
      message:
        "NEXTAUTH_SECRET must be at least 32 characters and base64 encoded",
    },
    NEXTAUTH_URL: {
      value: process.env.NEXTAUTH_URL!,
      pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
      message: "NEXTAUTH_URL must be a valid URL",
    },
  };

  // 各環境変数の検証
  for (const [key, validation] of Object.entries(envValidation)) {
    const { value, message } = validation;

    if (!value || value.trim() === "") {
      throw new Error(`${key} is required and cannot be empty`);
    }

    if ("minLength" in validation && value.length < validation.minLength) {
      throw new Error(`${key} ${message}`);
    }

    if ("pattern" in validation && !validation.pattern.test(value)) {
      throw new Error(`${key} ${message}`);
    }
  }

  // NEXTAUTH_SECRETの強度チェック
  const secret = process.env.NEXTAUTH_SECRET!;
  if (secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be at least 32 characters long");
  }

  // DATABASE_URLの形式チェック
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith("postgresql://")) {
    throw new Error(
      "DATABASE_URL must be a valid PostgreSQL connection string"
    );
  }

  // NEXTAUTH_URLの形式チェック
  const authUrl = process.env.NEXTAUTH_URL!;
  try {
    new URL(authUrl);
  } catch {
    throw new Error("NEXTAUTH_URL must be a valid URL");
  }

  // Google OAuth設定の検証
  const googleClientId = process.env.GOOGLE_CLIENT_ID!;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  if (googleClientId.length < 10) {
    throw new Error("GOOGLE_CLIENT_ID appears to be invalid");
  }

  if (googleClientSecret.length < 10) {
    throw new Error("GOOGLE_CLIENT_SECRET appears to be invalid");
  }

  // 本番環境での追加チェック
  if (process.env.NODE_ENV === "production") {
    if (!authUrl.startsWith("https://")) {
      throw new Error("NEXTAUTH_URL must use HTTPS in production");
    }

    if (secret.length < 64) {
      console.warn(
        "Warning: NEXTAUTH_SECRET should be at least 64 characters long in production"
      );
    }

    // 本番環境では管理者セキュリティトークンが必須
    if (!process.env.ADMIN_SECURITY_TOKEN) {
      throw new Error("ADMIN_SECURITY_TOKEN is required in production");
    }

    const adminToken = process.env.ADMIN_SECURITY_TOKEN;
    if (adminToken.length < 32) {
      throw new Error(
        "ADMIN_SECURITY_TOKEN must be at least 32 characters long"
      );
    }
  }
}

// 環境変数の型定義
export interface Env {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  NODE_ENV: "development" | "production" | "test";
}

// 型安全な環境変数アクセス
export function getEnv(): Env {
  validateEnv();

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
  };
}

// 機密情報のログ出力防止
export function safeLog(obj: any, sensitiveKeys: string[] = []): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const result = { ...obj };
  const defaultSensitiveKeys = [
    "password",
    "secret",
    "token",
    "key",
    "credential",
    "DATABASE_URL",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_SECURITY_TOKEN",
  ];

  const allSensitiveKeys = [...defaultSensitiveKeys, ...sensitiveKeys];

  allSensitiveKeys.forEach((key) => {
    if (key in result) {
      result[key] = "[REDACTED]";
    }
  });

  return result;
}

// 開発環境でのみ使用するデバッグ関数
export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEBUG] ${message}`, data ? safeLog(data) : "");
  }
}

// アプリケーション起動時に環境変数を検証
if (typeof window === "undefined") {
  try {
    validateEnv();
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Environment variables validated successfully");
    }
  } catch (error) {
    console.error("❌ Environment validation failed:", safeLog(error));
    process.exit(1);
  }
}
