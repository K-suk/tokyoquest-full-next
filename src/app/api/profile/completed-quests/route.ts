import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// キャッシュを無効化
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

    // 完了したquest一覧を取得
    const completedQuests = await prisma.questCompletion.findMany({
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
          },
        },
      },
      orderBy: {
        completion_date: "desc",
      },
    });

    return NextResponse.json({
      completedQuests: completedQuests,
    });
  } catch (error) {
    console.error("Error fetching completed quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
