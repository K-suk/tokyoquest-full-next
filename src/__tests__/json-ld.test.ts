import {
  createTokyoQuestWebSiteJsonLd,
  createTokyoQuestOrganizationJsonLd,
  createSafeJsonLd,
} from "../lib/json-ld";
import { z } from "zod";

describe("JSON-LD Security Tests", () => {
  test("WebSite JSON-LD should be valid and safe", () => {
    const webSiteData = createTokyoQuestWebSiteJsonLd();

    // 必要な属性が含まれているかチェック
    expect(webSiteData["@context"]).toBe("https://schema.org");
    expect(webSiteData["@type"]).toBe("WebSite");
    expect(webSiteData.name).toBe("TokyoQuest");
    expect(webSiteData.url).toBe("https://www.tokyoquest.jp/");

    // JSON文字列化してXSS文字が含まれていないかチェック
    const jsonString = JSON.stringify(webSiteData);
    expect(jsonString).not.toContain("<script>");
    expect(jsonString).not.toContain("javascript:");
    expect(jsonString).not.toContain("onload=");
  });

  test("Organization JSON-LD should be valid and safe", () => {
    const orgData = createTokyoQuestOrganizationJsonLd();

    // 必要な属性が含まれているかチェック
    expect(orgData["@context"]).toBe("https://schema.org");
    expect(orgData["@type"]).toBe("Organization");
    expect(orgData.name).toBe("TokyoQuest");
    expect(orgData.url).toBe("https://www.tokyoquest.jp/");

    // JSON文字列化してXSS文字が含まれていないかチェック
    const jsonString = JSON.stringify(orgData);
    expect(jsonString).not.toContain("<script>");
    expect(jsonString).not.toContain("javascript:");
    expect(jsonString).not.toContain("onload=");
  });

  test("createSafeJsonLd should escape dangerous characters", () => {
    const maliciousSchema = z.object({
      name: z.string(),
      description: z.string(),
    });

    const maliciousData = {
      name: 'Test</script><script>alert("XSS")</script>',
      description: 'Description with <img src=x onerror=alert("XSS")>',
    };

    const safeJsonString = createSafeJsonLd(maliciousSchema, maliciousData);

    // 危険な文字がエスケープされているかチェック
    expect(safeJsonString).not.toContain("</script>");
    expect(safeJsonString).not.toContain("<script>");
    expect(safeJsonString).not.toContain("<img");
    expect(safeJsonString).not.toContain("onerror=");

    // エスケープされた文字が含まれているかチェック
    expect(safeJsonString).toContain("\\u003c");
    expect(safeJsonString).toContain("\\u003e");
  });

  test("createSafeJsonLd should handle invalid data gracefully", () => {
    const schema = z.object({
      name: z.string(),
      url: z.string().url(),
    });

    const invalidData = {
      name: 123, // 数値（文字列期待）
      url: "invalid-url", // 無効なURL
    };

    const result = createSafeJsonLd(schema, invalidData);

    // 無効なデータの場合は安全なフォールバック
    expect(result).toBe("{}");
  });
});
