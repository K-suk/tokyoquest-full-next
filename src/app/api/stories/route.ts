import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all story chapters
    const chapters = await prisma.storyChapter.findMany({
      orderBy: { level: "asc" },
      select: {
        id: true,
        level: true,
        title: true,
        themeHints: true,
        estReadSec: true,
      },
    });

    // Get user's story progress
    const progress = await prisma.storyProgress.findUnique({
      where: { userId: user.id },
    });

    const unlockedLevels = progress?.unlockedLevels || [];
    const lastReadAtByLevel =
      (progress?.lastReadAtByLevel as Record<string, string>) || {};

    // Get user's answers
    const answers = await prisma.storyAnswer.findMany({
      where: { userId: user.id },
      select: { level: true, answer: true },
    });

    const answersByLevel = answers.reduce((acc, answer) => {
      acc[answer.level] = answer.answer;
      return acc;
    }, {} as Record<number, string>);

    // Combine data
    const chaptersWithStatus = chapters.map((chapter) => ({
      ...chapter,
      unlocked: unlockedLevels.includes(chapter.level),
      lastReadAt: lastReadAtByLevel[chapter.level.toString()] || null,
      hasAnswer: !!answersByLevel[chapter.level],
    }));

    return NextResponse.json({
      chapters: chaptersWithStatus,
      unlockedLevels,
      totalChapters: chapters.length,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
