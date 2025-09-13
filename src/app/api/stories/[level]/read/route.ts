import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { storyTelemetry } from "@/lib/telemetry";

async function getOrCreateStoryProgress(userId: string) {
  let progress = await prisma.storyProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    progress = await prisma.storyProgress.create({
      data: {
        userId,
        unlockedLevels: [],
        lastReadAtByLevel: {},
      },
    });
  }

  return progress;
}

export async function POST(
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

    const { readMs, scrollDepth } = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create story progress
    const progress = await getOrCreateStoryProgress(user.id);

    // Check if chapter is unlocked
    if (!progress.unlockedLevels.includes(levelNum)) {
      return NextResponse.json(
        { error: "Chapter not unlocked" },
        { status: 403 }
      );
    }

    // Update last read timestamp
    const lastReadAtByLevel =
      (progress.lastReadAtByLevel as Record<string, string>) || {};
    lastReadAtByLevel[levelNum.toString()] = new Date().toISOString();

    await prisma.storyProgress.update({
      where: { id: progress.id },
      data: {
        lastReadAtByLevel,
      },
    });

    // Fire telemetry event
    storyTelemetry.completed(levelNum, readMs || 0, scrollDepth || 0);

    return NextResponse.json({
      success: true,
      lastReadAt: lastReadAtByLevel[levelNum.toString()],
    });
  } catch (error) {
    console.error("Error marking story as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
