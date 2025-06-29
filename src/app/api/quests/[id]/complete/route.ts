import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { questRateLimiter, withRateLimit } from "@/lib/rate-limit";

// キャッシュを無効化
export const dynamic = "force-dynamic";

// セキュリティヘッダー
export const headers = {
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
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // 6) Base64データの検証
    if (!imageData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    // 7) データサイズの制限（5MB）
    const base64Data = imageData.split(",")[1];
    const dataSize = Math.ceil((base64Data.length * 3) / 4);
    if (dataSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
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

    // 11) 経験値を追加（レベルアップロジックは別途実装）
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        exp: {
          increment: 100, // 仮の経験値
        },
      },
      select: {
        exp: true,
        level: true,
      },
    });

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
    });
  } catch (error) {
    console.error("Error completing quest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
