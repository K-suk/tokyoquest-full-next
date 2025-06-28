import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔗 Linking tags to quests...");

  // --- ここで紐付けを定義 ---

  // 例1: 「渋谷スクランブル交差点ツアー」に「shibuya」と「culture」タグを紐付ける
  const quest1 = await prisma.quest.findFirst({
    where: { title: "渋谷スクランブル交差点ツアー" }, // 仮のクエストタイトル
  });

  if (quest1) {
    await prisma.quest.update({
      where: { id: quest1.id },
      data: {
        tags: {
          connect: [{ name: "shibuya" }, { name: "culture" }],
        },
      },
    });
    console.log(`✅ Linked tags to: ${quest1.title}`);
  }

  // 例2: 「秋葉原アニメ聖地巡礼」に「anime」タグを紐付ける
  const quest2 = await prisma.quest.findFirst({
    where: { title: "秋葉原アニメ聖地巡礼" }, // 仮のクエストタイトル
  });

  if (quest2) {
    await prisma.quest.update({
      where: { id: quest2.id },
      data: {
        tags: {
          connect: [{ name: "akihabara" }],
        },
      },
    });
    console.log(`✅ Linked tags to: ${quest2.title}`);
  }

  // 他のクエストも同様に追加...

  console.log("🎉 Linking completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during linking:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
