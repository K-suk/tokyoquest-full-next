import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// キャッシュを無効化
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 保存されたquest一覧を取得
    const savedQuests = await prisma.savedQuest.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        quest: {
          select: {
            id: true,
            title: true,
            description: true,
            imgUrl: true,
            location: true,
            badget: true,
          },
        },
      },
      orderBy: {
        saved_at: "desc",
      },
    });

    return NextResponse.json({
      savedQuests: savedQuests.map((savedQuest) => ({
        id: savedQuest.id,
        saved_at: savedQuest.saved_at,
        quest: savedQuest.quest,
      })),
    });
  } catch (error) {
    console.error("Error fetching saved quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
