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

// アプリケーション起動時に環境変数を検証
if (typeof window === "undefined") {
  try {
    validateEnv();
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Environment variables validated successfully");
    }
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    process.exit(1);
  }
}
