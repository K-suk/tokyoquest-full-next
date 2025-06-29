// src/app/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import QuestCard from "../components/QuestCard";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { toQuestDTO } from "@/lib/dto";

// キャッシュ設定を最適化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// セキュリティヘッダー
export const headers = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

// ブラウザのキャッシュを無効化
export const metadata = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Sample categories with icons
const categories = [
  { id: 1, name: "nightlife", displayName: "Night Life", icon: "/images/categories/night_life_category.png" },
  { id: 2, name: "shibuya", displayName: "Shibuya", icon: "/images/categories/Shibuya_area_category.png" },
  { id: 3, name: "shinjuku", displayName: "Shinjuku", icon: "/images/categories/Shinjuku_area_category.png" },
  { id: 4, name: "food", displayName: "Food", icon: "/images/categories/food_category.png" },
  { id: 5, name: "anime", displayName: "Akihabara", icon: "/images/categories/anime_category.png" },
  { id: 6, name: "family", displayName: "Family", icon: "/images/categories/family_category.png" },
  { id: 7, name: "alcohol", displayName: "Bar", icon: "/images/categories/alcohol_category.png" },
  { id: 8, name: "asakusa", displayName: "Asakusa", icon: "/images/categories/asakusa_category.png" },
];

export default async function HomePage() {
  // 1) サーバーセッションをチェック（セッション情報は露出させない）
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    // 未ログインなら /login にリダイレクト
    redirect("/login");
  }

  // 2) ユーザーIDを取得
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  // ユーザーが存在しない場合はログインページにリダイレクト
  if (!user) {
    redirect("/login");
  }

  // 3) 並列でデータを取得（パフォーマンス向上）
  const [quests, savedQuests] = await Promise.all([
    // Prismaからクエスト一覧を取得
    prisma.quest.findMany({
      orderBy: { date_created: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imgUrl: true,
        location: true,
        badget: true,
      },
    }),
    // ユーザーが保存したクエストのID一覧を取得（user_idで直接検索）
    prisma.savedQuest.findMany({
      where: {
        user_id: user.id,
      },
      select: {
        quest_id: true,
      },
    }),
  ]);

  // 4) DTOに変換してClient Componentに渡す（セキュリティ強化）
  const questDTOs = quests.map(quest => toQuestDTO(quest));
  const savedQuestIds = new Set(savedQuests.map(sq => sq.quest_id));

  return (
    <main className="pb-6">
      {/* Famous Categories */}
      <section className="px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">Famous Categories</h2>
        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.name}`}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 relative mb-1">
                <Image
                  src={cat.icon}
                  alt={cat.displayName}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <span className="text-sm text-center">{cat.displayName}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* All Quests */}
      <section className="px-4 mt-8">
        <h2 className="text-2xl font-bold mb-4">All Quests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {questDTOs?.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={{
                ...quest,
                imgUrl: quest.imgUrl ?? "",
                is_saved: savedQuestIds.has(quest.id)
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
