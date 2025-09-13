import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level } = await params;
    const levelNum = parseInt(level);

    if (isNaN(levelNum) || levelNum < 1 || levelNum > 10) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if chapter is unlocked
    const progress = await prisma.storyProgress.findUnique({
      where: { userId: user.id },
    });

    const unlockedLevels = progress?.unlockedLevels || [];
    if (!unlockedLevels.includes(levelNum)) {
      return NextResponse.json(
        { error: "Chapter not unlocked" },
        { status: 403 }
      );
    }

    // Get chapter
    const chapter = await prisma.storyChapter.findUnique({
      where: { level: levelNum },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error fetching story chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
