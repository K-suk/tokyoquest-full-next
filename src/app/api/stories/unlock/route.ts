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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level } = await request.json();

    if (!level || typeof level !== "number" || level < 1 || level > 10) {
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

    // Get or create story progress
    const progress = await getOrCreateStoryProgress(user.id);

    // Check if already unlocked (idempotent)
    if (progress.unlockedLevels.includes(level)) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        unlockedLevels: progress.unlockedLevels,
      });
    }

    // Unlock the level
    const updatedProgress = await prisma.storyProgress.update({
      where: { id: progress.id },
      data: {
        unlockedLevels: [...progress.unlockedLevels, level],
      },
    });

    // Fire telemetry event
    storyTelemetry.unlocked(level);

    return NextResponse.json({
      success: true,
      unlockedLevels: updatedProgress.unlockedLevels,
      newlyUnlocked: level,
    });
  } catch (error) {
    console.error("Error unlocking story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
