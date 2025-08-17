import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/blog",
          "/blog/*",
          "/privacy",
          "/term",
          "/sitemap.xml",
          "/robots.txt",
        ],
        disallow: [
          "/category",
          "/quests/*",
          "/category/*",
          "/profile/*",
          "/saved_quests",
          "/miasanmia_admin/*",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://www.tokyoquest.jp/sitemap.xml",
  };
}
