// src/app/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { toQuestDTO } from "@/lib/dto";

// 動的インポートでPaginatedQuestsを遅延読み込み
const PaginatedQuests = dynamic(() => import("../components/PaginatedQuests"), {
  loading: () => <div className="animate-pulse space-y-4">
    <div className="h-12 bg-gray-200 rounded"></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-[200px]" />
      ))}
    </div>
  </div>,
  ssr: true,
});

// パフォーマンス最適化 - 60秒間キャッシュ
export const revalidate = 60;


// ホームページのメタデータ
export const metadata = {
  title: 'TokyoQuest - 東京をゲームのように探索しよう',
  description: 'TokyoQuestで東京をビデオゲームのように探索！クエストを完了して思い出を写真や動画で保存しよう。',
  keywords: ['東京', 'Tokyo', '観光', 'クエスト', 'Quest', '探索', 'Sightseeing'],
  robots: 'index, follow',
  openGraph: {
    title: 'TokyoQuest - 東京をゲームのように探索しよう',
    description: 'TokyoQuestで東京をビデオゲームのように探索！',
    url: 'https://www.tokyoquest.jp',
    siteName: 'TokyoQuest',
    type: 'website',
  },
};


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
  const [initialQuests, savedQuests, tags, totalCount] = await Promise.all([
    // Prismaからクエスト一覧を取得（最初の20件のみ）
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
      take: 20,
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
    // タグ一覧を取得（クエスト数でソート、最大8個）
    prisma.tag.findMany({
      include: {
        _count: {
          select: { quests: true },
        },
      },
      orderBy: {
        quests: {
          _count: "desc",
        },
      },
      take: 8,
    }),
    // 総クエスト数を取得
    prisma.quest.count(),
  ]);

  // 4) DTOに変換してClient Componentに渡す（セキュリティ強化）
  const questDTOs = initialQuests.map(quest => toQuestDTO(quest));
  const savedQuestIds = new Set(savedQuests.map(sq => sq.quest_id));

  // ページネーション情報を構築
  const initialPagination = {
    currentPage: 1,
    totalPages: Math.ceil(totalCount / 20),
    totalCount,
    hasNextPage: totalCount > 20,
    hasPrevPage: false,
  };

  return (
    <main className="pb-6">
      {/* Famous Categories */}
      <section className="px-4 py-6 relative">
        <h2 className="text-2xl font-bold mb-4">Famous Categories</h2>
        <div className="grid grid-cols-4 gap-4">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/category/${tag.id}`}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 relative mb-1">
                {tag.imageUrl ? (
                  <Image
                    src={tag.imageUrl}
                    alt={tag.name}
                    fill
                    className="object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No image</span>
                  </div>
                )}
              </div>
              <span className="text-sm text-center">{tag.name}</span>
              <span className="text-xs text-gray-500">{tag._count.quests} quests</span>
            </Link>
          ))}
        </div>
        <div className="text-right">
          <Link
            href="/category"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Check All Tags
          </Link>
        </div>
      </section>


      {/* All Quests */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4 px-4">All Quests</h2>
        <PaginatedQuests
          initialQuests={questDTOs.map(quest => ({
            ...quest,
            imgUrl: quest.imgUrl ?? "",
            is_saved: savedQuestIds.has(quest.id)
          }))}
          initialPagination={initialPagination}
        />
      </section>
    </main>
  );
}
