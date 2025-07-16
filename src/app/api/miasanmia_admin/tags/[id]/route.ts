import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// PUT /api/miasanmia_admin/tags/[id] - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const tagId = parseInt(id);
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 同じ名前のタグが既に存在するかチェック（自分以外）
    const existingTag = await prisma.tag.findFirst({
      where: {
        name,
        id: { not: tagId },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 400 }
      );
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name,
        description,
        imageUrl,
      },
      include: {
        _count: {
          select: { quests: true },
        },
      },
    });

    return NextResponse.json({
      ...updatedTag,
      questCount: updatedTag._count.quests,
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/miasanmia_admin/tags/[id] - Delete a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const tagId = parseInt(id);
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    // タグに関連するクエストがあるかチェック
    const tagWithQuests = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { quests: true },
        },
      },
    });

    if (!tagWithQuests) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    if (tagWithQuests._count.quests > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete tag that has associated quests",
        },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
