import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // 並列でデータを取得してパフォーマンスを向上
    const [quests, tag, savedQuests] = await Promise.all([
      // クエストを取得（必要なフィールドのみ選択）
      prisma.quest.findMany({
        where: {
          tags: {
            some: {
              name: id,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          imgUrl: true,
          date_created: true,
        },
        orderBy: {
          date_created: "desc",
        },
      }),
      // タグ情報を取得
      prisma.tag.findFirst({
        where: { name: id },
        select: {
          name: true,
          description: true,
        },
      }),
      // ログイン済みの場合のみ保存済みクエストを取得
      session?.user?.email
        ? prisma.savedQuest.findMany({
            where: {
              user: {
                email: session.user.email,
              },
            },
            select: {
              quest_id: true,
            },
          })
        : Promise.resolve([]),
    ]);

    if (!tag) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // 保存済みクエストのID配列を作成
    const savedQuestIds = savedQuests.map((sq) => sq.quest_id);

    return NextResponse.json({
      quests,
      tag,
      savedQuestIds,
    });
  } catch (error) {
    console.error("Error fetching category data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
