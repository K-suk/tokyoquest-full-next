import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding tags and linking to quests...");

  // 1. タグを作成
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: "food" },
      update: {},
      create: {
        name: "food",
        description: "食べ物・グルメ関連のクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "shopping" },
      update: {},
      create: {
        name: "shopping",
        description: "ショッピング関連のクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "culture" },
      update: {},
      create: {
        name: "culture",
        description: "文化・歴史関連のクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "nightlife" },
      update: {},
      create: {
        name: "nightlife",
        description: "ナイトライフ関連のクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "family" },
      update: {},
      create: {
        name: "family",
        description: "家族向けのクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "anime" },
      update: {},
      create: {
        name: "anime",
        description: "アニメ・マンガ関連のクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "alcohol" },
      update: {},
      create: {
        name: "alcohol",
        description: "お酒・バー関連のクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "asakusa" },
      update: {},
      create: {
        name: "asakusa",
        description: "浅草エリアのクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "shibuya" },
      update: {},
      create: {
        name: "shibuya",
        description: "渋谷エリアのクエスト",
      },
    }),
    prisma.tag.upsert({
      where: { name: "shinjuku" },
      update: {},
      create: {
        name: "shinjuku",
        description: "新宿エリアのクエスト",
      },
    }),
  ]);

  console.log(
    "✅ Tags created:",
    tags.map((t) => t.name)
  );

  // 2. 既存のクエストを取得
  const quests = await prisma.quest.findMany();
  console.log(`📋 Found ${quests.length} quests`);

  // 3. クエストにタグを紐づけ
  for (const quest of quests) {
    const tagsToConnect = [];

    // クエストのタイトルや説明に基づいてタグを自動割り当て
    const title = quest.title.toLowerCase();
    const description = quest.description.toLowerCase();

    if (
      title.includes("food") ||
      title.includes("食べ") ||
      description.includes("food") ||
      description.includes("食べ")
    ) {
      tagsToConnect.push("food");
    }
    if (
      title.includes("shopping") ||
      title.includes("買い物") ||
      description.includes("shopping") ||
      description.includes("買い物")
    ) {
      tagsToConnect.push("shopping");
    }
    if (
      title.includes("culture") ||
      title.includes("文化") ||
      description.includes("culture") ||
      description.includes("文化")
    ) {
      tagsToConnect.push("culture");
    }
    if (
      title.includes("night") ||
      title.includes("夜") ||
      description.includes("night") ||
      description.includes("夜")
    ) {
      tagsToConnect.push("nightlife");
    }
    if (
      title.includes("family") ||
      title.includes("家族") ||
      description.includes("family") ||
      description.includes("家族")
    ) {
      tagsToConnect.push("family");
    }
    if (
      title.includes("anime") ||
      title.includes("アニメ") ||
      description.includes("anime") ||
      description.includes("アニメ")
    ) {
      tagsToConnect.push("anime");
    }
    if (
      title.includes("alcohol") ||
      title.includes("酒") ||
      description.includes("alcohol") ||
      description.includes("酒")
    ) {
      tagsToConnect.push("alcohol");
    }
    if (
      title.includes("asakusa") ||
      title.includes("浅草") ||
      description.includes("asakusa") ||
      description.includes("浅草")
    ) {
      tagsToConnect.push("asakusa");
    }
    if (
      title.includes("shibuya") ||
      title.includes("渋谷") ||
      description.includes("shibuya") ||
      description.includes("渋谷")
    ) {
      tagsToConnect.push("shibuya");
    }
    if (
      title.includes("shinjuku") ||
      title.includes("新宿") ||
      description.includes("shinjuku") ||
      description.includes("新宿")
    ) {
      tagsToConnect.push("shinjuku");
    }

    // デフォルトでcultureタグを追加（何もマッチしない場合）
    if (tagsToConnect.length === 0) {
      tagsToConnect.push("culture");
    }

    // タグをクエストに紐づけ
    await prisma.quest.update({
      where: { id: quest.id },
      data: {
        tags: {
          connect: tagsToConnect.map((name) => ({ name })),
        },
      },
    });

    console.log(
      `🔗 Linked quest "${quest.title}" with tags: ${tagsToConnect.join(", ")}`
    );
  }

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
