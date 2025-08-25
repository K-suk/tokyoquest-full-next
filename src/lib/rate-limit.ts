import { NextRequest } from "next/server";

// 高度なRate Limiter実装
export class AdvancedRateLimiter {
  private store = new Map<
    string,
    { count: number; resetTime: number; blocked: boolean }
  >();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000,
    blockDurationMs: number = 60 * 60 * 1000
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  // クライアント識別子を生成
  private generateIdentifier(request: NextRequest): string {
    // For authenticated users, use user ID as primary identifier
    const userId = request.headers.get("x-user-id");
    if (userId && userId !== "anonymous") {
      return `user:${userId}`;
    }

    // For unauthenticated users, use IP with validation
    // Note: In production, consider using a trusted proxy configuration
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    // Take the first IP from x-forwarded-for (original client IP)
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Generate a hash of user-agent to prevent easy manipulation
    // while still allowing rate limiting per client
    const userAgent = request.headers.get("user-agent") || "";
    const uaHash = userAgent
      ? require("crypto")
          .createHash("sha256")
          .update(userAgent)
          .digest("hex")
          .substring(0, 8)
      : "no-ua";

    return `ip:${ip}:${uaHash}`;
  }

  // Rate Limitチェック
  checkRateLimit(request: NextRequest): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } {
    const identifier = this.generateIdentifier(request);
    const now = Date.now();

    // 古いエントリをクリーンアップ
    this.cleanup();

    const entry = this.store.get(identifier);

    if (!entry) {
      // 新しいエントリを作成
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
        blocked: false,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    // ブロック期間中かチェック
    if (entry.blocked && now < entry.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true,
      };
    }

    // ウィンドウがリセットされているかチェック
    if (now > entry.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
        blocked: false,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    // リクエスト数が上限に達しているかチェック
    if (entry.count >= this.maxRequests) {
      // ブロック状態に設定
      entry.blocked = true;
      entry.resetTime = now + this.blockDurationMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true,
      };
    }

    // リクエスト数を増加
    entry.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  // 古いエントリをクリーンアップ
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      // ブロックされていないエントリ: resetTimeが過ぎたら削除
      // ブロックされているエントリ: resetTimeが過ぎたら削除（resetTimeは既にブロック期間を含む）
      const shouldDelete = now > entry.resetTime;

      if (shouldDelete) {
        this.store.delete(key);
      }
    }
  }

  // 統計情報を取得
  getStats(): { totalEntries: number; blockedEntries: number } {
    let blockedCount = 0;
    for (const entry of this.store.values()) {
      if (entry.blocked) {
        blockedCount++;
      }
    }

    return {
      totalEntries: this.store.size,
      blockedEntries: blockedCount,
    };
  }
}

// グローバルRate Limiterインスタンス
export const globalRateLimiter = new AdvancedRateLimiter(
  100,
  15 * 60 * 1000,
  60 * 60 * 1000
);

// API専用Rate Limiter
export const apiRateLimiter = new AdvancedRateLimiter(
  50,
  5 * 60 * 1000,
  30 * 60 * 1000
);

// 認証専用Rate Limiter
export const authRateLimiter = new AdvancedRateLimiter(
  5,
  15 * 60 * 1000,
  60 * 60 * 1000
);

// アップロード専用Rate Limiter
export const uploadRateLimiter = new AdvancedRateLimiter(
  10,
  60 * 60 * 1000,
  2 * 60 * 60 * 1000
);

// 後方互換性のための古い関数（段階的移行用）
export const questRateLimiter = apiRateLimiter;
export const adminRateLimiter = new AdvancedRateLimiter(
  20,
  5 * 60 * 1000,
  30 * 60 * 1000
);

// 古いwithRateLimit関数（後方互換性）
export function withRateLimit(
  rateLimiter: AdvancedRateLimiter,
  identifier: string
): { allowed: boolean; remaining: number; resetTime: number } {
  // 古いAPIとの互換性のため、ダミーのNextRequestを作成
  const dummyRequest = {
    headers: {
      get: (name: string) => {
        if (name === "x-forwarded-for") return identifier.split(":")[0];
        if (name === "user-agent") return identifier.split(":")[1] || "unknown";
        if (name === "x-user-id")
          return identifier.split(":")[2] || "anonymous";
        return null;
      },
    },
  } as any;

  const result = rateLimiter.checkRateLimit(dummyRequest);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetTime: result.resetTime,
  };
}
