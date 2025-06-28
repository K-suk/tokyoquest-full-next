import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId)) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    const { tagIds } = await request.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "tagIds must be an array" },
        { status: 400 }
      );
    }

    // questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 既存のtag関連付けを削除して新しい関連付けを作成
    await prisma.quest.update({
      where: { id: questId },
      data: {
        tags: {
          set: tagIds.map((tagId: number) => ({ id: tagId })),
        },
      },
    });

    // 更新されたquestデータを取得
    const updatedQuest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      quest: updatedQuest,
    });
  } catch (error) {
    console.error("Error updating quest tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
