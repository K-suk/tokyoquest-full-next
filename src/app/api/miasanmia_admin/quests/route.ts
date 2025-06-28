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
    const search = searchParams.get("search") || "";

    // フィルタ条件を構築
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // ページネーション計算
    const skip = (page - 1) * limit;

    // questデータを取得
    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          date_created: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.quest.count({ where }),
    ]);

    return NextResponse.json({
      quests: quests.map((quest) => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        tips: quest.tips,
        imgUrl: quest.imgUrl,
        location: quest.location,
        badget: quest.badget,
        date_created: quest.date_created,
        tags: quest.tags,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
