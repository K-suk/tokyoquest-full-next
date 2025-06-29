import { z } from "zod";

// 汎用バリデーション関数
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.errors.map((e) => e.message).join(", "),
      };
    }
  } catch {
    return {
      success: false,
      error: "バリデーションエラーが発生しました",
    };
  }
}

// 共通スキーマ
export const questIdSchema = z.number().int().positive();
export const userIdSchema = z.number().int().positive();
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

// クエスト保存スキーマ
export const saveQuestSchema = z.object({
  questId: questIdSchema,
});

// クエスト完了スキーマ
export const completeQuestSchema = z.object({
  questId: questIdSchema,
});

// レビュー投稿スキーマ
export const postReviewSchema = z.object({
  questId: questIdSchema,
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

// プロフィール更新スキーマ（SQLインジェクション対策）
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "ユーザー名は必須です")
    .max(50, "ユーザー名は50文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u3300-\u33FF\uFE30-\uFE4F\uFF00-\uFFEF\s\-\.]+$/,
      "ユーザー名に使用できない文字が含まれています"
    )
    .refine(
      (name) => {
        // SQLインジェクション攻撃の一般的なパターンをチェック
        const dangerousPatterns = [
          /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/i,
          /[;'"`\\]/,
          /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        ];

        return !dangerousPatterns.some((pattern) => pattern.test(name));
      },
      {
        message: "ユーザー名に使用できない文字が含まれています",
      }
    )
    .transform((name) => name.trim()),
});

// データ取得制限スキーマ
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20), // 最大100件まで
});

// 検索スキーマ
export const searchSchema = z.object({
  query: z.string().max(100, "検索クエリは100文字以内で入力してください"),
  limit: z.number().int().min(1).max(50).default(20), // 検索結果は最大50件
});
