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

// クエストID検証スキーマ
export const questIdSchema = z.number().positive("Invalid quest ID");

// クエスト完了検証スキーマ
export const questCompletionSchema = z.object({
  imageData: z.string().min(1, "Image data is required"),
  questId: questIdSchema,
});

// レビュー投稿検証スキーマ（セキュリティ強化版）
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
    .trim()
    // XSS攻撃対策: 危険なHTMLタグやスクリプトを検出
    .refine(
      (comment) => {
        const dangerousPatterns = [
          /<script[^>]*>/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /<iframe[^>]*>/i,
          /<object[^>]*>/i,
          /<embed[^>]*>/i,
          /<link[^>]*>/i,
          /<meta[^>]*>/i,
          /<form[^>]*>/i,
          /<input[^>]*>/i,
          /<textarea[^>]*>/i,
          /<select[^>]*>/i,
          /<button[^>]*>/i,
          /<a[^>]*href\s*=\s*["']?javascript:/i,
          /<img[^>]*on\w+\s*=/i,
          /<svg[^>]*on\w+\s*=/i,
          /<div[^>]*on\w+\s*=/i,
          /<span[^>]*on\w+\s*=/i,
          /<p[^>]*on\w+\s*=/i,
          /<h[1-6][^>]*on\w+\s*=/i,
        ];
        return !dangerousPatterns.some((pattern) => pattern.test(comment));
      },
      {
        message: "Comment contains potentially dangerous content",
      }
    )
    // SQLインジェクション攻撃対策: 危険なSQLパターンを検出
    .refine(
      (comment) => {
        const sqlPatterns = [
          /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
          /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(from|into|where|set|values)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(table|column|database|schema)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(user|password|admin|root)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(sys|information_schema|mysql|postgresql)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(version|user|database|schema)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(concat|substring|length|count|sum|avg|max|min)\b)/i,
          /(\b(union|select|insert|update|delete|drop|create|alter)\s+.*\b(if|case|when|then|else|end)\b)/i,
        ];
        return !sqlPatterns.some((pattern) => pattern.test(comment));
      },
      {
        message: "Comment contains potentially dangerous SQL patterns",
      }
    )
    // パストラバーサル攻撃対策
    .refine(
      (comment) => {
        const pathTraversalPatterns = [
          /\.\.\//g,
          /\.\.\\/g,
          /\.\.%2f/gi,
          /\.\.%5c/gi,
          /\.\.%2F/gi,
          /\.\.%5C/gi,
          /\.\.%252f/gi,
          /\.\.%255c/gi,
          /\.\.%252F/gi,
          /\.\.%255C/gi,
          /\.\.%c0%af/gi,
          /\.\.%c1%9c/gi,
          /\.\.%c0%AF/gi,
          /\.\.%c1%9C/gi,
          /\.\.%e0%80%af/gi,
          /\.\.%e0%80%9c/gi,
          /\.\.%e0%80%AF/gi,
          /\.\.%e0%80%9C/gi,
          /\.\.%f0%80%80%af/gi,
          /\.\.%f0%80%80%9c/gi,
          /\.\.%f0%80%80%AF/gi,
          /\.\.%f0%80%80%9C/gi,
        ];
        return !pathTraversalPatterns.some((pattern) => pattern.test(comment));
      },
      {
        message:
          "Comment contains potentially dangerous path traversal patterns",
      }
    )
    // 特殊文字の過度な使用を制限
    .refine(
      (comment) => {
        // 連続する特殊文字を制限
        const excessiveSpecialChars = /[!@#$%^&*(),.?":{}|<>]{3,}/;
        return !excessiveSpecialChars.test(comment);
      },
      {
        message: "Comment contains excessive special characters",
      }
    )
    // 改行文字の過度な使用を制限
    .refine(
      (comment) => {
        const newlineCount = (comment.match(/\n/g) || []).length;
        return newlineCount <= 10; // 最大10行まで
      },
      {
        message: "Comment contains too many line breaks",
      }
    ),
});

// ファイルアップロード検証スキーマ（サーバーサイド対応）
export const fileUploadSchema = z.object({
  file: z.any().refine(
    (val) => {
      // サーバーサイドではFileクラスが存在しないため、オブジェクトチェック
      if (typeof window === "undefined") {
        return typeof val === "object" && val !== null;
      }
      // クライアントサイドではFileインスタンスチェック
      return val instanceof File;
    },
    {
      message: "File must be a valid file object",
    }
  ),
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
