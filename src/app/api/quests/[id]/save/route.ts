import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// キャッシュを無効化
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId)) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 既に保存済みかチェック
    const existingSavedQuest = await prisma.savedQuest.findUnique({
      where: {
        user_id_quest_id: {
          user_id: user.id,
          quest_id: questId,
        },
      },
    });

    if (existingSavedQuest) {
      return NextResponse.json(
        { error: "Quest already saved" },
        { status: 409 }
      );
    }

    // quest保存データを作成
    const savedQuest = await prisma.savedQuest.create({
      data: {
        user_id: user.id,
        quest_id: questId,
        saved_at: new Date(),
      },
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      savedQuest: {
        id: savedQuest.id,
        saved_at: savedQuest.saved_at,
        quest: savedQuest.quest,
        user: savedQuest.user,
      },
    });
  } catch (error) {
    console.error("Error saving quest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId)) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 保存されたquestを削除
    const deletedSavedQuest = await prisma.savedQuest.deleteMany({
      where: {
        user_id: user.id,
        quest_id: questId,
      },
    });

    if (deletedSavedQuest.count === 0) {
      return NextResponse.json(
        { error: "Saved quest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quest unsaved successfully",
    });
  } catch (error) {
    console.error("Error unsaving quest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
