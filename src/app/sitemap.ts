import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.tokyoquest.jp";
  const fallbackNow = new Date();

  let questUrls: MetadataRoute.Sitemap = [];

  try {
    // Questの詳細ページを取得
    const quests = await prisma.quest.findMany({
      select: {
        id: true,
        date_created: true,
      },
      orderBy: {
        date_created: "desc",
      },
    });

    questUrls = quests.map((quest) => ({
      url: `${baseUrl}/quests/${quest.id}`,
      lastModified: quest.date_created,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    // DB接続不能時もsitemap生成自体は継続してビルド失敗を防ぐ
    console.error("Failed to load quests for sitemap:", error);
  }

  return [
    {
      url: baseUrl,
      lastModified: fallbackNow,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: fallbackNow,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category`,
      lastModified: fallbackNow,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...questUrls,
    {
      url: `${baseUrl}/privacy`,
      lastModified: fallbackNow,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/term`,
      lastModified: fallbackNow,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
