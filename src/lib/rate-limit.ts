// レート制限の実装
// メモリベースのシンプルなレート制限

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // 新しいウィンドウまたは期限切れ
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    return entry ? entry.resetTime : Date.now() + this.windowMs;
  }

  // 古いエントリをクリーンアップ
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// 異なるエンドポイント用のレート制限
export const generalRateLimiter = new RateLimiter(60000, 100); // 1分間に100リクエスト
export const authRateLimiter = new RateLimiter(60000, 10); // 認証関連は厳しく制限
export const questRateLimiter = new RateLimiter(60000, 50); // クエスト関連
export const adminRateLimiter = new RateLimiter(60000, 20); // 管理機能は厳しく制限

// 定期的にクリーンアップ
setInterval(() => {
  generalRateLimiter.cleanup();
  authRateLimiter.cleanup();
  questRateLimiter.cleanup();
  adminRateLimiter.cleanup();
}, 60000); // 1分ごとにクリーンアップ

// レート制限ミドルウェア
export function withRateLimit(
  rateLimiter: RateLimiter,
  identifier: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const allowed = rateLimiter.isAllowed(identifier);
  const remaining = rateLimiter.getRemaining(identifier);
  const resetTime = rateLimiter.getResetTime(identifier);

  return { allowed, remaining, resetTime };
}
