import { z } from "zod";

// JSON-LDスキーマの定義
const WebSiteJsonLdSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("WebSite"),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  inLanguage: z.string().min(2).max(5),
  potentialAction: z
    .object({
      "@type": z.literal("SearchAction"),
      target: z.string().url(),
      "query-input": z.string(),
    })
    .optional(),
});

const OrganizationJsonLdSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("Organization"),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  logo: z.string().url().optional(),
  sameAs: z.array(z.string().url()).optional(),
});

// 型定義
export type WebSiteJsonLd = z.infer<typeof WebSiteJsonLdSchema>;
export type OrganizationJsonLd = z.infer<typeof OrganizationJsonLdSchema>;

// 安全なJSON-LD文字列生成関数
export function createSafeJsonLd<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): string {
  try {
    // スキーマでデータを検証
    const validatedData = schema.parse(data);

    // JSON文字列化（XSS対策のためエスケープ）
    const jsonString = JSON.stringify(validatedData);

    // 追加のエスケープ処理（script injection対策）
    return (
      jsonString
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029")
        // 危険なJavaScriptイベントハンドラーをエスケープ
        .replace(/on\w+\s*=/gi, "\\u006f\\u006e\\u0020\\u003d")
        // 危険なプロトコルをエスケープ
        .replace(
          /javascript:/gi,
          "\\u006a\\u0061\\u0076\\u0061\\u0073\\u0063\\u0072\\u0069\\u0070\\u0074\\u003a"
        )
        .replace(/data:/gi, "\\u0064\\u0061\\u0074\\u0061\\u003a")
        .replace(
          /vbscript:/gi,
          "\\u0076\\u0062\\u0073\\u0063\\u0072\\u0069\\u0070\\u0074\\u003a"
        )
    );
  } catch (error) {
    console.error("JSON-LD validation failed:", error);
    return "{}"; // 安全なフォールバック
  }
}

// TokyoQuest用のJSON-LDデータ生成
export function createTokyoQuestWebSiteJsonLd(): WebSiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TokyoQuest",
    url: "https://www.tokyoquest.jp/",
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.tokyoquest.jp/search?q={query}",
      "query-input": "required name=query",
    },
  };
}

export function createTokyoQuestOrganizationJsonLd(): OrganizationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TokyoQuest",
    url: "https://www.tokyoquest.jp/",
    logo: "https://www.tokyoquest.jp/icon.png",
    sameAs: ["https://www.instagram.com/tokyoquest/"],
  };
}

// 安全なJSON-LD文字列生成のヘルパー関数
export function generateWebSiteJsonLd(): string {
  const data = createTokyoQuestWebSiteJsonLd();
  return createSafeJsonLd(WebSiteJsonLdSchema, data);
}

export function generateOrganizationJsonLd(): string {
  const data = createTokyoQuestOrganizationJsonLd();
  return createSafeJsonLd(OrganizationJsonLdSchema, data);
}
