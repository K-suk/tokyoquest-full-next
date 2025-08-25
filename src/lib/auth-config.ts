import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { AuthOptions } from "next-auth";
import { randomUUID } from "crypto";
import { securityLogger } from "./logger";

// セッション固定化対策のためのセッションストア（メモリ制限付き）

// セッションストアの設定
const SESSION_STORE_CONFIG = {
  MAX_SIZE: process.env.NODE_ENV === "test" ? 5 : 1000, // テスト環境では小さなサイズ
  MAX_AGE: 24 * 60 * 60 * 1000, // 24時間
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30分
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10分
} as const;

const activeSessionTokens = new Map<
  string,
  {
    userId: string;
    sessionId: string;
    createdAt: number;
    lastAccess: number;
    ipAddress?: string;
    userAgent?: string;
  }
>();

// LRUエビクション戦略でセッションを削除
function evictOldestSessions(targetSize: number): void {
  if (activeSessionTokens.size <= targetSize) {
    return;
  }

  // lastAccessでソートして最も古いセッションを削除
  const entries = Array.from(activeSessionTokens.entries());
  entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

  const toDelete = entries.slice(0, activeSessionTokens.size - targetSize);

  for (const [tokenId, sessionData] of toDelete) {
    activeSessionTokens.delete(tokenId);
    securityLogger.logSessionSecurityEvent(
      sessionData.ipAddress || "unknown",
      sessionData.userAgent || "unknown",
      sessionData.userId,
      "SESSION_EVICTED",
      {
        sessionId: sessionData.sessionId,
        reason: "memory_limit_exceeded",
        lastAccess: new Date(sessionData.lastAccess).toISOString(),
      }
    );
  }
}

// セッションを安全に追加（サイズ制限チェック付き）
function addSessionSafely(
  tokenId: string,
  sessionData: {
    userId: string;
    sessionId: string;
    createdAt: number;
    lastAccess: number;
    ipAddress?: string;
    userAgent?: string;
  }
): void {
  // サイズ制限に達している場合、古いセッションを削除
  if (activeSessionTokens.size >= SESSION_STORE_CONFIG.MAX_SIZE) {
    evictOldestSessions(SESSION_STORE_CONFIG.MAX_SIZE - 1);
  }

  activeSessionTokens.set(tokenId, sessionData);
}

// セッションアクセス時のlastAccess更新
function updateSessionAccess(tokenId: string): void {
  const sessionData = activeSessionTokens.get(tokenId);
  if (sessionData) {
    sessionData.lastAccess = Date.now();
  }
}

// セッション無効化関数
export function invalidateUserSessions(userId: string): void {
  for (const [tokenId, sessionData] of activeSessionTokens.entries()) {
    if (sessionData.userId === userId) {
      activeSessionTokens.delete(tokenId);
      securityLogger.logSessionSecurityEvent(
        sessionData.ipAddress || "unknown",
        sessionData.userAgent || "unknown",
        userId,
        "SESSION_INVALIDATED",
        { sessionId: sessionData.sessionId, reason: "security_invalidation" }
      );
    }
  }
}

// テスト用: セッションストアの状態を取得
export function getActiveSessionTokens() {
  return new Map(activeSessionTokens);
}

// セッションストアの統計情報を取得
export function getSessionStoreStats() {
  const now = Date.now();
  const stats = {
    totalSessions: activeSessionTokens.size,
    maxSize: SESSION_STORE_CONFIG.MAX_SIZE,
    usagePercentage:
      (activeSessionTokens.size / SESSION_STORE_CONFIG.MAX_SIZE) * 100,
    expiredSessions: 0,
    inactiveSessions: 0,
  };

  for (const sessionData of activeSessionTokens.values()) {
    if (now - sessionData.createdAt > SESSION_STORE_CONFIG.MAX_AGE) {
      stats.expiredSessions++;
    }
    if (
      now - sessionData.lastAccess >
      SESSION_STORE_CONFIG.INACTIVITY_TIMEOUT
    ) {
      stats.inactiveSessions++;
    }
  }

  return stats;
}

// テスト用: セッションストアをクリア
export function clearActiveSessionTokens() {
  activeSessionTokens.clear();
}

// テスト用: セッションを手動で追加
export function addTestSession(
  tokenId: string,
  sessionData: {
    userId: string;
    sessionId: string;
    createdAt: number;
    lastAccess: number;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  addSessionSafely(tokenId, sessionData);
}

// テスト用: JWTコールバックのロジックを実行
export async function testJwtCallback(params: {
  token: any;
  user: any;
  account: any;
  trigger?: "signIn" | "signUp" | "update";
}) {
  const jwtCallback = authOptions.callbacks?.jwt;
  if (!jwtCallback) {
    throw new Error("JWT callback not found");
  }
  return await jwtCallback(params);
}

// 古いセッションのクリーンアップ（改善版）
function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [tokenId, sessionData] of activeSessionTokens.entries()) {
    const isExpired =
      now - sessionData.createdAt > SESSION_STORE_CONFIG.MAX_AGE;
    const isInactive =
      now - sessionData.lastAccess > SESSION_STORE_CONFIG.INACTIVITY_TIMEOUT;

    if (isExpired || isInactive) {
      activeSessionTokens.delete(tokenId);
      cleanedCount++;

      securityLogger.logSessionSecurityEvent(
        sessionData.ipAddress || "unknown",
        sessionData.userAgent || "unknown",
        sessionData.userId,
        "SESSION_CLEANED_UP",
        {
          sessionId: sessionData.sessionId,
          reason: isExpired ? "expired" : "inactive",
          createdAt: new Date(sessionData.createdAt).toISOString(),
          lastAccess: new Date(sessionData.lastAccess).toISOString(),
        }
      );
    }
  }

  // クリーンアップ後にサイズ制限をチェック
  if (activeSessionTokens.size > SESSION_STORE_CONFIG.MAX_SIZE * 0.9) {
    evictOldestSessions(Math.floor(SESSION_STORE_CONFIG.MAX_SIZE * 0.8));
  }

  if (cleanedCount > 0) {
    console.log(
      `[SESSION_CLEANUP] Removed ${cleanedCount} expired/inactive sessions. Current size: ${activeSessionTokens.size}`
    );
  }
}

// 定期的なクリーンアップ（設定された間隔で）
// 開発環境では無効化（リダイレクトループを防ぐため）
if (process.env.NODE_ENV === "production") {
  setInterval(cleanupExpiredSessions, SESSION_STORE_CONFIG.CLEANUP_INTERVAL);
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24時間
    updateAge: 60 * 60, // 1時間ごとに更新
  },
  // セッション管理のセキュリティ強化（Next.jsのデフォルトJWT処理を使用）
  secret: process.env.NEXTAUTH_SECRET || "placeholder-secret-for-build",
  callbacks: {
    async signIn({ account, profile, user, email }) {
      if (!account || !profile) return false;
      if (account.provider !== "google") return false;

      // email_verifiedがbooleanでtrueかどうかを型安全に判定
      if (
        typeof (profile as { email_verified?: unknown }).email_verified !==
          "boolean" ||
        !(profile as { email_verified: boolean }).email_verified
      ) {
        return false;
      }

      // メールアドレスの検証
      const userEmail = (profile as { email?: string }).email || email;
      if (!userEmail || typeof userEmail !== "string") {
        return false;
      }

      // セッション固定化対策: 既存のセッションを全て無効化
      // 注意: 初回ログインではユーザーIDが確定していない場合があるため条件を追加
      if (user?.id && typeof user.id === "string") {
        try {
          invalidateUserSessions(user.id);
        } catch (error) {
          console.warn("Session invalidation failed during login:", error);
          // ログイン処理は続行する
        }
      }

      // 新しいセッションIDを生成
      const newSessionId = randomUUID();

      // セキュリティログに記録
      securityLogger.logSessionSecurityEvent(
        "unknown", // IPは後で取得
        "unknown", // User-Agentは後で取得
        user?.id || "unknown",
        "LOGIN_SUCCESS",
        {
          provider: account.provider,
          email: userEmail,
          sessionId: newSessionId,
          action: "session_regenerated",
        }
      );

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          name: token.name || session.user.name,
          email: token.email || session.user.email,
          image: token.picture || session.user.image,
        };
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      const now = Math.floor(Date.now() / 1000);

      if (account && user) {
        // セッション固定化対策: ログイン時に完全に新しいトークンを生成
        const newSessionId = randomUUID();
        const newTokenId = randomUUID();

        // 古いトークンを無効化（セッション固定化攻撃を防ぐ）
        if (token.jti) {
          activeSessionTokens.delete(token.jti as string);
        }

        // 新しいトークンデータを設定
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.iat = now; // 発行時刻を更新
        token.jti = newTokenId; // 新しい一意のトークンID
        token.exp = now + 24 * 60 * 60; // 24時間有効期限
        token.sessionId = newSessionId; // 新しいセッション固有ID
        token.loginTime = now; // ログイン時刻
        token.lastActivity = now; // 最終アクティビティ
        token.userId = user.id; // ユーザーID追加

        // 新しいセッションを安全に追跡（サイズ制限チェック付き）
        addSessionSafely(newTokenId, {
          userId: user.id || "unknown",
          sessionId: newSessionId,
          createdAt: Date.now(),
          lastAccess: Date.now(),
        });

        securityLogger.logSessionSecurityEvent(
          "unknown",
          "unknown",
          user.id || "unknown",
          "TOKEN_REGENERATED",
          { sessionId: newSessionId, tokenId: newTokenId }
        );
      }

      // トークンの基本検証（ログイン時は除く）
      if (account && user) {
        // ログイン時は新しいトークンなので検証をスキップ
        return token;
      }

      // 既存セッションの検証
      if (!token.jti || !token.sessionId || !token.userId) {
        throw new Error("Invalid token structure");
      }

      // セッション追跡の検証（初回セッション以外）
      const sessionData = activeSessionTokens.get(token.jti as string);
      if (!sessionData) {
        // セッションが見つからない場合、新しいセッションとして安全に登録
        addSessionSafely(token.jti as string, {
          userId: token.userId as string,
          sessionId: token.sessionId as string,
          createdAt: Date.now(),
          lastAccess: Date.now(),
        });
      } else {
        // セッションアクセス時にlastAccessを更新（LRUサポート）
        updateSessionAccess(token.jti as string);
      }

      // 既存トークンの有効期限チェック
      if (typeof token.exp === "number" && token.exp < now) {
        activeSessionTokens.delete(token.jti as string);
        throw new Error("Token expired");
      }

      // セッション更新時（updateAge経過時）
      if (
        trigger === "update" &&
        typeof token.lastActivity === "number" &&
        sessionData
      ) {
        const timeSinceLastActivity = now - token.lastActivity;

        // 設定された時間以上アクティビティがない場合はセッションを無効化
        if (
          timeSinceLastActivity >
          SESSION_STORE_CONFIG.INACTIVITY_TIMEOUT / 1000
        ) {
          activeSessionTokens.delete(token.jti as string);
          throw new Error("Session expired due to inactivity");
        }

        // 最終アクティビティを更新
        token.lastActivity = now;
        sessionData.lastAccess = Date.now();

        // セッション固定化対策: 定期的にセッションIDを更新（1時間ごと）
        // ただし、頻繁すぎる更新を避ける
        if (timeSinceLastActivity > 3 * 60 * 60) {
          // 3時間ごとに変更
          const newSessionId = randomUUID();
          const oldSessionId = token.sessionId;
          token.sessionId = newSessionId;
          sessionData.sessionId = newSessionId;

          securityLogger.logSessionSecurityEvent(
            "unknown",
            "unknown",
            token.userId as string,
            "SESSION_ID_ROTATED",
            { oldSessionId, newSessionId }
          );
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 24時間
        // セッション固定化対策: ドメインを明示的に設定
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "").split(
                ":"
              )[0]
            : undefined,
        // セキュリティ強化: クッキーの再利用を防ぐ
        ...(process.env.NODE_ENV === "production" && {
          partitioned: true, // パーティション化クッキー（Chrome 118+）
        }),
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1時間
        // セキュリティ強化
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "")
            : undefined,
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "strict", // 常にstrictに設定（セッション固定化対策）
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1時間
        // __Host- プレフィックスを使用時はdomainを設定しない
        ...(process.env.NODE_ENV !== "production" && {
          domain: undefined,
        }),
      },
    },
  },
  // セキュリティ設定（削除 - 上記で定義済み）
};
