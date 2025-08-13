import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET(
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
      select: { isStaff: true },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const questId = parseInt(id);

    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        tags: true,
      },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    return NextResponse.json({ quest });
  } catch (error) {
    console.error("Error fetching quest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      select: { isStaff: true },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const questId = parseInt(id);

    const questData = await request.json();
    const { title, description, imgUrl, location, tips, badget, tagIds } =
      questData;

    // Validate required fields
    if (!title || !description || !location) {
      return NextResponse.json(
        { error: "Title, description, and location are required" },
        { status: 400 }
      );
    }

    // Check if quest exists
    const existingQuest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!existingQuest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // Validate tags if provided
    if (tagIds && tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true },
      });

      if (existingTags.length !== tagIds.length) {
        return NextResponse.json(
          { error: "Some tags not found" },
          { status: 400 }
        );
      }
    }

    // Update quest
    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        title,
        description,
        imgUrl: imgUrl || null,
        location,
        tips: tips || null,
        badget: badget || null,
        tags: {
          set: [], // Clear existing tags
          connect: tagIds ? tagIds.map((tagId: number) => ({ id: tagId })) : [],
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({
      message: "Quest updated successfully",
      quest: updatedQuest,
    });
  } catch (error) {
    console.error("Error updating quest:", error);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isStaff: true },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const questId = parseInt(id);

    // Check if quest exists
    const existingQuest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!existingQuest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // Delete related records first (completions, saved quests, reviews, etc.)
    await prisma.questCompletion.deleteMany({
      where: { quest_id: questId },
    });

    await prisma.savedQuest.deleteMany({
      where: { quest_id: questId },
    });

    await prisma.review.deleteMany({
      where: { quest_id: questId },
    });

    // Delete the quest (tags association will be automatically removed)
    await prisma.quest.delete({
      where: { id: questId },
    });

    return NextResponse.json({
      message: "Quest deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
