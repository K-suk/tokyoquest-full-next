export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { questRateLimiter, withRateLimit } from "@/lib/rate-limit";
import { calculateLevel } from "@/lib/level-system";
import { storyTelemetry } from "@/lib/telemetry";

// キャッシュを無効化
export const dynamic = "force-dynamic";

// セキュリティヘッダー
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1) レート制限チェック
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const rateLimitId = `${ip}:${userAgent}`;

    const { allowed } = withRateLimit(questRateLimiter, rateLimitId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // 2) セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId) || questId <= 0) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    // 3) ユーザー情報を取得（セキュリティ強化）
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, exp: true, level: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4) リクエストボディからデータを取得
    const { imageData } = await request.json();

    // 5) 入力値検証を強化
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Media data is required" },
        { status: 400 }
      );
    }

    // 6) Base64データの検証（画像または動画）
    if (
      !imageData.startsWith("data:image/") &&
      !imageData.startsWith("data:video/")
    ) {
      return NextResponse.json(
        { error: "Invalid media format. Only images and videos are allowed." },
        { status: 400 }
      );
    }

    // 7) データサイズの制限（10MB for videos, 5MB for images）
    const base64Data = imageData.split(",")[1];
    const dataSize = Math.ceil((base64Data.length * 3) / 4);
    const maxSize = imageData.startsWith("data:video/")
      ? 10 * 1024 * 1024
      : 5 * 1024 * 1024;
    const maxSizeMB = imageData.startsWith("data:video/") ? 10 : 5;

    if (dataSize > maxSize) {
      return NextResponse.json(
        { error: `Media size must be less than ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // 8) questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 9) 既に完了済みかチェック
    const existingCompletion = await prisma.questCompletion.findFirst({
      where: {
        user_id: user.id,
        quest_id: questId,
      },
      select: { id: true },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: "Quest already completed" },
        { status: 409 }
      );
    }

    // 10) クエスト完了を記録
    const completion = await prisma.questCompletion.create({
      data: {
        user_id: user.id,
        quest_id: questId,
        media: imageData,
      },
      select: {
        id: true,
        completion_date: true,
      },
    });

    // 11) 経験値を追加してレベルアップをチェック
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { exp: true, level: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const expGained = 100; // クエスト完了で100経験値
    const newExp = currentUser.exp + expGained;
    const oldLevel = calculateLevel(currentUser.exp);
    const newLevel = calculateLevel(newExp);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        exp: newExp,
        level: newLevel,
      },
      select: {
        exp: true,
        level: true,
      },
    });

    // 12) レベルアップした場合、ストーリーをアンロック
    const leveledUp = newLevel > oldLevel;
    let unlockedStories: number[] = [];

    if (leveledUp) {
      // 新しいレベルに達したストーリーチャプターをアンロック
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        if (level <= 10) {
          // ストーリーはレベル10まで
          try {
            // ストーリープログレスを取得または作成
            let storyProgress = await prisma.storyProgress.findUnique({
              where: { userId: user.id },
            });

            if (!storyProgress) {
              storyProgress = await prisma.storyProgress.create({
                data: {
                  userId: user.id,
                  unlockedLevels: [],
                  lastReadAtByLevel: {},
                },
              });
            }

            // レベルがまだアンロックされていない場合のみ追加
            if (!storyProgress.unlockedLevels.includes(level)) {
              await prisma.storyProgress.update({
                where: { id: storyProgress.id },
                data: {
                  unlockedLevels: [...storyProgress.unlockedLevels, level],
                },
              });
              unlockedStories.push(level);

              // テレメトリーイベントを送信
              storyTelemetry.unlocked(level);
            }
          } catch (error) {
            console.error(`Error unlocking story level ${level}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      completion: {
        id: completion.id,
        completion_date: completion.completion_date,
      },
      user: {
        exp: updatedUser.exp,
        level: updatedUser.level,
      },
      levelUp: leveledUp
        ? {
            oldLevel,
            newLevel,
            expGained,
            unlockedStories,
          }
        : null,
    });
  } catch (error) {
    console.error("Error completing quest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
