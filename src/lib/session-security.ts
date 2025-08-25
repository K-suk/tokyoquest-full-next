// セッション管理のセキュリティ機能
import { NextRequest } from "next/server";
import { securityLogger } from "./logger";

// セッション情報の型定義
export interface SessionInfo {
  sessionId: string;
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  loginTime: number;
  lastActivity: number;
  isActive: boolean;
}

// セッション管理用のインメモリストア
export const sessionStore = new Map<string, SessionInfo>();

// セッションの有効期限設定（秒）
const SESSION_TIMEOUT = 30 * 60; // 30分
const MAX_SESSIONS_PER_USER = 3; // ユーザーあたり最大3セッション

/**
 * セッションを作成・登録
 */
export function createSession(
  sessionId: string,
  userId: string,
  email: string,
  ip: string,
  userAgent: string
): void {
  const now = Math.floor(Date.now() / 1000);

  // 既存のセッションをチェック
  const existingSessions = Array.from(sessionStore.values()).filter(
    (session) => session.userId === userId && session.isActive
  );

  // 最大セッション数を超える場合、古いセッションを削除
  if (existingSessions.length >= MAX_SESSIONS_PER_USER) {
    const oldestSession = existingSessions.sort(
      (a, b) => a.loginTime - b.loginTime
    )[0];
    if (oldestSession) {
      invalidateSession(oldestSession.sessionId, "max_sessions_exceeded");
      securityLogger.logSessionSecurityEvent(
        ip,
        userAgent,
        userId,
        "SESSION_REPLACED",
        {
          reason: "max_sessions_exceeded",
          oldSessionId: oldestSession.sessionId,
          newSessionId: sessionId,
        }
      );
    }
  }

  // 新しいセッションを登録
  sessionStore.set(sessionId, {
    sessionId,
    userId,
    email,
    ip,
    userAgent,
    loginTime: now,
    lastActivity: now,
    isActive: true,
  });

  securityLogger.logSessionSecurityEvent(
    ip,
    userAgent,
    userId,
    "SESSION_CREATED",
    {
      sessionId,
      email,
    }
  );
}

/**
 * セッションを更新
 */
export function updateSession(
  sessionId: string,
  ip: string,
  userAgent: string
): boolean {
  const session = sessionStore.get(sessionId);
  if (!session || !session.isActive) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  // IPアドレスが変更された場合のセキュリティチェック
  if (session.ip !== ip) {
    securityLogger.logSessionSecurityEvent(
      ip,
      userAgent,
      session.userId,
      "SESSION_IP_CHANGE",
      {
        sessionId,
        oldIp: session.ip,
        newIp: ip,
      }
    );

    // セッションを無効化
    invalidateSession(sessionId, "ip_change");
    return false;
  }

  // 最終アクティビティを更新
  session.lastActivity = now;
  session.ip = ip;
  session.userAgent = userAgent;

  return true;
}

/**
 * セッションを検証
 */
export function validateSession(
  sessionId: string,
  ip: string,
  userAgent: string
): SessionInfo | null {
  const session = sessionStore.get(sessionId);
  if (!session || !session.isActive) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  // セッションタイムアウトチェック
  if (now - session.lastActivity > SESSION_TIMEOUT) {
    securityLogger.logSessionSecurityEvent(
      ip,
      userAgent,
      session.userId,
      "SESSION_EXPIRED",
      {
        sessionId,
        reason: "timeout",
        lastActivity: session.lastActivity,
        currentTime: now,
      }
    );

    invalidateSession(sessionId, "timeout");
    return null;
  }

  // IPアドレスチェック
  if (session.ip !== ip) {
    securityLogger.logSessionSecurityEvent(
      ip,
      userAgent,
      session.userId,
      "SESSION_IP_MISMATCH",
      {
        sessionId,
        expectedIp: session.ip,
        actualIp: ip,
      }
    );

    invalidateSession(sessionId, "ip_mismatch");
    return null;
  }

  return session;
}

/**
 * セッションを無効化
 */
export function invalidateSession(
  sessionId: string,
  reason: string = "manual_logout"
): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    securityLogger.logSessionSecurityEvent(
      session.ip,
      session.userAgent,
      session.userId,
      "SESSION_INVALIDATED",
      {
        sessionId,
        reason,
      }
    );

    session.isActive = false;
    sessionStore.delete(sessionId);
  }
}

/**
 * ユーザーの全セッションを無効化
 */
export function invalidateAllUserSessions(
  userId: string,
  reason: string = "security_policy"
): void {
  const userSessions = Array.from(sessionStore.values()).filter(
    (session) => session.userId === userId && session.isActive
  );

  userSessions.forEach((session) => {
    invalidateSession(session.sessionId, reason);
  });

  securityLogger.logSessionSecurityEvent(
    "system",
    "system",
    userId,
    "ALL_SESSIONS_INVALIDATED",
    {
      reason,
      sessionCount: userSessions.length,
    }
  );
}

/**
 * 期限切れセッションのクリーンアップ
 */
export function cleanupExpiredSessions(): void {
  const now = Math.floor(Date.now() / 1000);
  const expiredSessions: string[] = [];

  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      expiredSessions.push(sessionId);
    }
  }

  expiredSessions.forEach((sessionId) => {
    invalidateSession(sessionId, "cleanup_timeout");
  });

  if (expiredSessions.length > 0) {
    securityLogger.log({
      event: "EXPIRED_SESSIONS_CLEANUP",
      severity: "low",
      details: {
        cleanedCount: expiredSessions.length,
        remainingSessions: sessionStore.size,
      },
    });
  }
}

/**
 * セッション統計情報を取得
 */
export function getSessionStats(): {
  totalSessions: number;
  activeSessions: number;
  uniqueUsers: number;
} {
  const activeSessions = Array.from(sessionStore.values()).filter(
    (session) => session.isActive
  );

  const uniqueUsers = new Set(activeSessions.map((session) => session.userId))
    .size;

  return {
    totalSessions: sessionStore.size,
    activeSessions: activeSessions.length,
    uniqueUsers,
  };
}

/**
 * リクエストからセッション情報を取得
 */
export function getSessionFromRequest(
  request: NextRequest
): SessionInfo | null {
  const sessionId =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionId) {
    return null;
  }

  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return validateSession(sessionId, ip, userAgent);
}

// 定期的なクリーンアップ（5分ごと）
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}
