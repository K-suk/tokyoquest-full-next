import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { toQuestDTO } from "@/lib/dto";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // ページネーションの制限
    const maxLimit = 50;
    const actualLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * actualLimit;

    // クエストと総数を並列で取得
    const [quests, totalCount, savedQuests] = await Promise.all([
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
        take: actualLimit,
        skip: offset,
      }),
      prisma.quest.count(),
      prisma.savedQuest.findMany({
        where: { user_id: user.id },
        select: { quest_id: true },
      }),
    ]);

    const questDTOs = quests.map((quest) => toQuestDTO(quest));
    const savedQuestIds = new Set(savedQuests.map((sq) => sq.quest_id));

    const totalPages = Math.ceil(totalCount / actualLimit);

    return NextResponse.json({
      quests: questDTOs.map((quest) => ({
        ...quest,
        is_saved: savedQuestIds.has(quest.id),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching paginated quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
