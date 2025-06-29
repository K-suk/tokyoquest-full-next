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
