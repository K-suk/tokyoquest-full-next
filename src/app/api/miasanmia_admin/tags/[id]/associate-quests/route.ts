import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // スタッフ権限チェック
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isStaff: true },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const tagId = parseInt(id);

    // タグの存在確認
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const { questIds } = await request.json();

    if (!Array.isArray(questIds) || questIds.length === 0) {
      return NextResponse.json(
        { error: "Quest IDs array is required" },
        { status: 400 }
      );
    }

    // クエストの存在確認
    const existingQuests = await prisma.quest.findMany({
      where: { id: { in: questIds } },
      select: { id: true },
    });

    if (existingQuests.length !== questIds.length) {
      return NextResponse.json(
        { error: "Some quests not found" },
        { status: 400 }
      );
    }

    // 既存のタグ付与を確認し、新しいタグ付与を作成
    const results = await Promise.all(
      questIds.map(async (questId) => {
        // 既にタグが付与されているかチェック
        const existing = await prisma.quest.findFirst({
          where: {
            id: questId,
            tags: { some: { id: tagId } },
          },
        });

        if (existing) {
          return { questId, status: "already_exists" };
        }

        // タグを付与
        await prisma.quest.update({
          where: { id: questId },
          data: {
            tags: {
              connect: { id: tagId },
            },
          },
        });

        return { questId, status: "added" };
      })
    );

    const addedCount = results.filter((r) => r.status === "added").length;
    const alreadyExistsCount = results.filter(
      (r) => r.status === "already_exists"
    ).length;

    return NextResponse.json({
      success: true,
      message: `Tag associated with ${addedCount} quests. ${alreadyExistsCount} quests already had this tag.`,
      results,
    });
  } catch (error) {
    console.error("Error associating tag with quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
