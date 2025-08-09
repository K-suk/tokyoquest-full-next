import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/*",
          "/category",
          "/category/*",
          "/quests/*",
          "/privacy",
          "/term",
        ],
        disallow: [
          "/login",
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
