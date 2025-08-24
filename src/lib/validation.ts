import { z } from "zod";

// ユーザー入力検証スキーマ
export const userInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

// プロフィール更新検証スキーマ
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

// クエスト完了検証スキーマ
export const questCompletionSchema = z.object({
  imageData: z.string().min(1, "Image data is required"),
  questId: z.number().positive("Invalid quest ID"),
});

// レビュー投稿検証スキーマ
export const reviewSchema = z.object({
  rating: z
    .number({ required_error: "Rating is required" })
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string({ required_error: "Comment is required" })
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters")
    .trim(),
});

// ファイルアップロード検証スキーマ（サーバーサイド対応）
export const fileUploadSchema = z.object({
  file: z.any().refine((val) => {
    // サーバーサイドではFileクラスが存在しないため、オブジェクトチェック
    if (typeof window === 'undefined') {
      return typeof val === 'object' && val !== null;
    }
    // クライアントサイドではFileインスタンスチェック
    return val instanceof File;
  }, {
    message: "File must be a valid file object"
  }),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z
    .array(z.string())
    .default(["image/jpeg", "image/png", "image/webp"]),
});

// API レスポンス検証スキーマ
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

// ページネーション検証スキーマ
export const paginationSchema = z.object({
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit too high")
    .default(20),
});

// セキュリティ検証関数
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};

// バリデーション結果を返す関数（ProfileHeader.tsx用）
export function validateInputWithResult<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    return {
      success: false,
      error: "バリデーションエラーが発生しました",
    };
  }
}

// ファイル検証関数
export const validateFile = (
  file: File,
  maxSize: number,
  allowedTypes: string[]
): void => {
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
};

// Base64検証関数
export const validateBase64 = (data: string, maxSize: number): void => {
  if (data.length > maxSize) {
    throw new Error("Base64 data too large");
  }

  // Base64形式の検証
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(data)) {
    throw new Error("Invalid Base64 format");
  }
};
