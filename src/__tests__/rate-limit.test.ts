import { AdvancedRateLimiter } from "../lib/rate-limit";

// NextRequestのモック
const createMockRequest = (headers: Record<string, string> = {}) => ({
  headers: {
    get: (name: string) => headers[name] || null,
  },
}) as any;

// タイマーのモック設定
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe("AdvancedRateLimiter", () => {
  let rateLimiter: AdvancedRateLimiter;

  beforeEach(() => {
    // テスト用の短い時間設定
    rateLimiter = new AdvancedRateLimiter(5, 1000, 2000); // 5リクエスト、1秒ウィンドウ、2秒ブロック
  });

  describe("Cleanup Logic", () => {
    test("should remove non-blocked entries after resetTime", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent",
      });

      // 複数のリクエストを送信してエントリを作成
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkRateLimit(request);
      }

      // 初期状態を確認
      expect(rateLimiter.getStats().totalEntries).toBe(1);

      // 1秒待機（resetTimeを過ぎる）
      jest.advanceTimersByTime(1100);

      // クリーンアップを手動実行
      (rateLimiter as any).cleanup();

      // 非ブロックエントリが削除されていることを確認
      expect(rateLimiter.getStats().totalEntries).toBe(0);
    });

    test("should keep blocked entries until extended period expires", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent",
      });

      // リクエスト制限を超えてブロック状態にする
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkRateLimit(request);
      }

      // ブロック状態を確認
      expect(rateLimiter.getStats().blockedEntries).toBe(1);
      expect(rateLimiter.getStats().totalEntries).toBe(1);

      // 2.1秒待機（ブロック期間が過ぎる）
      jest.advanceTimersByTime(2100);

      // クリーンアップを手動実行
      (rateLimiter as any).cleanup();

      // ブロックエントリが削除されていることを確認
      expect(rateLimiter.getStats().totalEntries).toBe(0);
      expect(rateLimiter.getStats().blockedEntries).toBe(0);
    });

    test("should handle mixed blocked and non-blocked entries correctly", () => {
      const request1 = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent-1",
      });

      const request2 = createMockRequest({
        "x-forwarded-for": "192.168.1.2",
        "user-agent": "test-agent-2",
      });

      // リクエスト1: 通常の使用（非ブロック）
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkRateLimit(request1);
      }

      // リクエスト2: 制限を超えてブロック
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkRateLimit(request2);
      }

      // 初期状態を確認
      expect(rateLimiter.getStats().totalEntries).toBe(2);
      expect(rateLimiter.getStats().blockedEntries).toBe(1);

      // 1秒待機（resetTimeを過ぎる）
      jest.advanceTimersByTime(1100);

      // クリーンアップを手動実行
      (rateLimiter as any).cleanup();

      // 非ブロックエントリのみが削除されていることを確認
      expect(rateLimiter.getStats().totalEntries).toBe(1);
      expect(rateLimiter.getStats().blockedEntries).toBe(1);

      // 2秒待機（ブロック期間が過ぎる）
      jest.advanceTimersByTime(2000);

      // クリーンアップを手動実行
      (rateLimiter as any).cleanup();

      // すべてのエントリが削除されていることを確認
      expect(rateLimiter.getStats().totalEntries).toBe(0);
      expect(rateLimiter.getStats().blockedEntries).toBe(0);
    });

    test("should reset non-blocked entries after window expires", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent",
      });

      // 2回リクエストを送信
      rateLimiter.checkRateLimit(request);
      rateLimiter.checkRateLimit(request);

      // 初期状態を確認
      expect(rateLimiter.getStats().totalEntries).toBe(1);

      // 1秒待機（resetTimeを過ぎる）
      jest.advanceTimersByTime(1100);

      // 新しいリクエストを送信（エントリがリセットされる）
      const result = rateLimiter.checkRateLimit(request);

      // カウントがリセットされていることを確認
      expect(result.remaining).toBe(4); // 5 - 1 = 4
      expect(result.allowed).toBe(true);
    });

    test("should maintain blocked state during block duration", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent",
      });

      // リクエスト制限を超えてブロック状態にする
      for (let i = 0; i < 6; i++) {
        rateLimiter.checkRateLimit(request);
      }

      // ブロック状態を確認
      expect(rateLimiter.getStats().blockedEntries).toBe(1);

      // 1秒待機（resetTimeは過ぎるが、ブロック期間はまだ）
      jest.advanceTimersByTime(1100);

      // 新しいリクエストを送信
      const result = rateLimiter.checkRateLimit(request);

      // まだブロックされていることを確認
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
    });
  });

  describe("Rate Limiting Behavior", () => {
    test("should allow requests within limit", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent",
      });

      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkRateLimit(request);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    test("should block requests when limit exceeded", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent",
      });

      // 制限内のリクエスト
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit(request);
      }

      // 制限を超えたリクエスト
      const result = rateLimiter.checkRateLimit(request);
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.remaining).toBe(0);
    });

    test("should generate different identifiers for different clients", () => {
      const request1 = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "test-agent-1",
      });

      const request2 = createMockRequest({
        "x-forwarded-for": "192.168.1.2",
        "user-agent": "test-agent-2",
      });

      rateLimiter.checkRateLimit(request1);
      rateLimiter.checkRateLimit(request2);

      // 異なるクライアントのエントリが作成されていることを確認
      expect(rateLimiter.getStats().totalEntries).toBe(2);
    });
  });
});
