import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 運営者権限確認
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.isStaff) {
      return NextResponse.json(
        { error: "Forbidden: Staff access required" },
        { status: 403 }
      );
    }

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const questId = searchParams.get("questId");
    const userId = searchParams.get("userId");

    // フィルタ条件を構築
    const where: {
      quest_id?: number;
      user_id?: string;
    } = {};
    if (questId) {
      where.quest_id = parseInt(questId);
    }
    if (userId) {
      where.user_id = userId;
    }

    // ページネーション計算
    const skip = (page - 1) * limit;

    // quest完了データを取得
    const [completions, total] = await Promise.all([
      prisma.questCompletion.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: {
          completion_date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.questCompletion.count({ where }),
    ]);

    return NextResponse.json({
      completions: completions.map((completion) => ({
        id: completion.id,
        completion_date: completion.completion_date,
        media: completion.media,
        user: completion.user,
        quest: completion.quest,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching completions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
