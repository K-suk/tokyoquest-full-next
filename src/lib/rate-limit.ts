// メモリベースのレート制限
interface RateLimitEntry {
  timestamp: number;
  count: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// レート制限の設定
const RATE_LIMIT_WINDOW = 60; // 60秒
const RATE_LIMIT_MAX_REQUESTS = 100; // 最大100リクエスト

export async function rateLimit(
  identifier: string,
  endpoint: string
): Promise<{ success: boolean; remaining: number }> {
  try {
    const key = `${endpoint}:${identifier}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW * 1000;

    // 現在のエントリを取得
    const entry = rateLimitStore.get(key);

    if (entry && entry.timestamp > windowStart) {
      // ウィンドウ内のリクエスト数が上限を超えている場合
      if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { success: false, remaining: 0 };
      }

      // リクエスト数を増加
      entry.count++;
      rateLimitStore.set(key, entry);
      return {
        success: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
      };
    } else {
      // 新しいウィンドウを開始
      rateLimitStore.set(key, { timestamp: now, count: 1 });
      return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }
  } catch (error) {
    console.error("Rate limiting error:", error);
    // エラーの場合は制限を緩和
    return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }
}

// 古いエントリをクリーンアップする関数
export function cleanupRateLimitStore() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW * 1000;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.timestamp < windowStart) {
      rateLimitStore.delete(key);
    }
  }
}

// 定期的にクリーンアップを実行（5分ごと）
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

// 特定のエンドポイント用のレート制限
export async function rateLimitQuestCompletion(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  return rateLimit(identifier, "quest-completion");
}

export async function rateLimitReviewSubmission(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  return rateLimit(identifier, "review-submission");
}

export async function rateLimitQuestStatus(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  return rateLimit(identifier, "quest-status");
}
