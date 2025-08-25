import {
  createSession,
  updateSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions,
  getSessionStats,
  sessionStore,
} from "../lib/session-security";

// NextRequestのモック
const createMockRequest = (
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {}
) =>
  ({
    headers: {
      get: (name: string) => headers[name] || null,
    },
    cookies: {
      get: (name: string) => ({ value: cookies[name] } || null),
    },
  } as any);

describe("Session Security Consistency", () => {
  beforeEach(() => {
    // 各テスト前にセッションストアをクリア
    sessionStore.clear();
  });

  describe("Session Invalidation Pattern", () => {
    test("should use invalidateSession for IP mismatch", () => {
      const sessionId = "test-session-1";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // 異なるIPでセッションを検証（IP mismatch）
      const result = validateSession(sessionId, "192.168.1.2", userAgent);

      // セッションが無効化されていることを確認
      expect(result).toBeNull();

      // セッションストアから削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });

    test("should use invalidateSession for session timeout", () => {
      const sessionId = "test-session-2";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // 時間を進めてタイムアウトをシミュレート
      const originalDateNow = Date.now;
      const mockTime = Date.now() + 2 * 60 * 60 * 1000; // 2時間後
      Date.now = jest.fn(() => mockTime);

      // セッションを検証（タイムアウト）
      const result = validateSession(sessionId, ip, userAgent);

      // セッションが無効化されていることを確認
      expect(result).toBeNull();

      // セッションストアから削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);

      // モックを復元
      Date.now = originalDateNow;
    });

    test("should use invalidateSession for IP change in updateSession", () => {
      const sessionId = "test-session-3";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // 異なるIPでセッションを更新（IP change）
      const result = updateSession(sessionId, "192.168.1.2", userAgent);

      // セッションが無効化されていることを確認
      expect(result).toBe(false);

      // セッションストアから削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });

    test("should use invalidateSession for max sessions exceeded", () => {
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // 最大セッション数を超えるセッションを作成
      for (let i = 0; i < 6; i++) {
        createSession(`session-${i}`, userId, email, ip, userAgent);
      }

      // 古いセッションが削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(3); // 最大3セッション
      expect(stats.activeSessions).toBe(3);
    });

    test("should use invalidateSession for manual invalidation", () => {
      const sessionId = "test-session-4";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // 手動でセッションを無効化
      invalidateSession(sessionId, "manual_logout");

      // セッションストアから削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });

    test("should use invalidateSession for all user sessions", () => {
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // 複数のセッションを作成
      createSession("session-1", userId, email, ip, userAgent);
      createSession("session-2", userId, email, ip, userAgent);
      createSession("session-3", "user-456", email, ip, userAgent); // 異なるユーザー

      // ユーザーの全セッションを無効化
      invalidateAllUserSessions(userId, "security_policy");

      // 指定ユーザーのセッションのみが削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(1); // 異なるユーザーのセッションは残る
      expect(stats.activeSessions).toBe(1);
    });

    test("should use invalidateSession for cleanup expired sessions", () => {
      const sessionId = "test-session-5";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // 時間を進めてタイムアウトをシミュレート
      const originalDateNow = Date.now;
      const mockTime = Date.now() + 2 * 60 * 60 * 1000; // 2時間後
      Date.now = jest.fn(() => mockTime);

      // 期限切れセッションのクリーンアップを実行
      cleanupExpiredSessions();

      // セッションストアから削除されていることを確認
      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);

      // モックを復元
      Date.now = originalDateNow;
    });
  });

  describe("Session State Consistency", () => {
    test("should maintain consistent session state during invalidation", () => {
      const sessionId = "test-session-6";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // セッションがアクティブであることを確認
      const initialStats = getSessionStats();
      expect(initialStats.activeSessions).toBe(1);

      // セッションを無効化
      invalidateSession(sessionId, "test_reason");

      // セッションが完全に削除されていることを確認
      const finalStats = getSessionStats();
      expect(finalStats.totalSessions).toBe(0);
      expect(finalStats.activeSessions).toBe(0);
    });

    test("should handle multiple invalidation reasons consistently", () => {
      const sessionId = "test-session-7";
      const userId = "user-123";
      const email = "test@example.com";
      const ip = "192.168.1.1";
      const userAgent = "test-agent";

      // セッションを作成
      createSession(sessionId, userId, email, ip, userAgent);

      // 異なる理由でセッションを無効化
      const reasons = [
        "manual_logout",
        "ip_mismatch",
        "timeout",
        "ip_change",
        "max_sessions_exceeded",
        "cleanup_timeout",
        "security_policy",
      ];

      reasons.forEach((reason) => {
        // セッションストアをクリア
        sessionStore.clear();

        // 新しいセッションを作成
        const newSessionId = `session-${reason}`;
        createSession(newSessionId, userId, email, ip, userAgent);

        // セッションを無効化
        invalidateSession(newSessionId, reason);

        // セッションが削除されていることを確認
        const stats = getSessionStats();
        expect(stats.totalSessions).toBe(0);
        expect(stats.activeSessions).toBe(0);
      });
    });
  });
});
