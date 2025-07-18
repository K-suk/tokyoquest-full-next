import { PrismaClient } from "@prisma/client";

declare global {
  // Next.js のホットリロード対策
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"], // 本番環境ではエラーのみ
    // 接続プールの設定
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Vercel環境での接続設定
    ...(process.env.NODE_ENV === "production" && {
      // 本番環境での接続プール設定
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
    // グローバルで機密フィールドを除外
    omit: {
      user: {
        // パスワードフィールドが存在する場合の対策
        // password: true,
        // その他の機密情報
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
      account: {
        // OAuth関連の機密情報
        refresh_token: true,
        access_token: true,
        id_token: true,
        oauth_token_secret: true,
        oauth_token: true,
      },
    },
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

// 接続エラーハンドリング
prisma
  .$connect()
  .then(() => {
    console.log("✅ Prisma Client connected successfully");
  })
  .catch((error) => {
    console.error("❌ Prisma Client connection failed:", error);
  });

// グレースフルシャットダウン
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
