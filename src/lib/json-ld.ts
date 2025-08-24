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
    return jsonString
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/'/g, "\\u0027")
      .replace(/"/g, "\\u0022");
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
