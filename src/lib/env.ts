import { z } from "zod";

// Zodスキーマによる環境変数検証
const envSchema = z.object({
  // 必須環境変数
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .regex(
      /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/,
      "DATABASE_URL must be a valid PostgreSQL connection string"
    )
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === "postgresql:" && parsed.hostname && parsed.port
        );
      } catch {
        return false;
      }
    }, "DATABASE_URL must be a valid PostgreSQL URL"),

  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "GOOGLE_CLIENT_ID is required")
    .regex(
      /^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/,
      "GOOGLE_CLIENT_ID must be a valid Google OAuth client ID"
    )
    .min(10, "GOOGLE_CLIENT_ID appears to be invalid"),

  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, "GOOGLE_CLIENT_SECRET is required")
    .min(24, "GOOGLE_CLIENT_SECRET must be at least 24 characters long")
    .min(10, "GOOGLE_CLIENT_SECRET appears to be invalid"),

  NEXTAUTH_SECRET: z
    .string()
    .min(1, "NEXTAUTH_SECRET is required")
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters long")
    .refine((value) => {
      // base64文字のみを含むかチェック
      if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
        return false;
      }
      // 実際にbase64デコード可能かチェック
      try {
        const decoded = Buffer.from(value, "base64");
        return decoded.length >= 24; // 最低192ビット（24バイト）
      } catch {
        return false;
      }
    }, "NEXTAUTH_SECRET must be a valid base64 encoded string of at least 24 bytes"),

  NEXTAUTH_URL: z
    .string()
    .min(1, "NEXTAUTH_URL is required")
    .url("NEXTAUTH_URL must be a valid URL")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "NEXTAUTH_URL must be a valid HTTP/HTTPS URL"),

  // オプション環境変数
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // 環境
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // 本番環境でのみ必須
  ADMIN_SECURITY_TOKEN: z
    .string()
    .min(32, "ADMIN_SECURITY_TOKEN must be at least 32 characters long")
    .optional(),
});

// 本番環境用の追加スキーマ
const productionEnvSchema = envSchema.extend({
  NEXTAUTH_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith("https://"),
      "NEXTAUTH_URL must use HTTPS in production"
    ),
  NEXTAUTH_SECRET: z
    .string()
    .min(1, "NEXTAUTH_SECRET is required")
    .min(
      64,
      "NEXTAUTH_SECRET should be at least 64 characters long in production"
    )
    .refine((value) => {
      // base64文字のみを含むかチェック
      if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
        return false;
      }
      // 実際にbase64デコード可能かチェック
      try {
        const decoded = Buffer.from(value, "base64");
        return decoded.length >= 24; // 最低192ビット（24バイト）
      } catch {
        return false;
      }
    }, "NEXTAUTH_SECRET must be a valid base64 encoded string of at least 24 bytes"),
  ADMIN_SECURITY_TOKEN: z
    .string()
    .min(32, "ADMIN_SECURITY_TOKEN is required in production"),
});

// 環境変数の検証
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === "production";
  const schema = isProduction ? productionEnvSchema : envSchema;

  try {
    const result = schema.parse(process.env);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Environment validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

// 環境変数の型定義（Zodスキーマから自動生成）
export type Env = z.infer<typeof envSchema>;
export type ProductionEnv = z.infer<typeof productionEnvSchema>;

// 型安全な環境変数アクセス
export function getEnv(): Env | ProductionEnv {
  return validateEnv();
}

// 環境変数の検証結果をキャッシュ
let cachedEnv: Env | ProductionEnv | null = null;

// キャッシュ付きの環境変数アクセス
export function getCachedEnv(): Env | ProductionEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
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
    const env = validateEnv();
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Environment variables validated successfully");
      debugLog("Environment variables loaded", {
        NODE_ENV: env.NODE_ENV,
        DATABASE_URL: env.DATABASE_URL ? "✓ Set" : "✗ Missing",
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing",
        NEXTAUTH_URL: env.NEXTAUTH_URL ? "✓ Set" : "✗ Missing",
        SUPABASE_URL: env.SUPABASE_URL ? "✓ Set" : "✗ Missing",
      });
    }
  } catch (error) {
    console.error("❌ Environment validation failed:", safeLog(error));
    process.exit(1);
  }
}
