export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { questRateLimiter, withRateLimit } from "@/lib/rate-limit";

// キャッシュを無効化
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

// POST: クエストを保存
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
        { error: "レート制限に達しました" },
        { status: 429 }
      );
    }

    // 2) セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId) || questId <= 0) {
      return NextResponse.json(
        { error: "無効なクエストIDです" },
        { status: 400 }
      );
    }

    // 3) ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 4) クエストの存在確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true, title: true },
    });

    if (!quest) {
      return NextResponse.json(
        { error: "クエストが見つかりません" },
        { status: 404 }
      );
    }

    // 5) 既に保存済みかチェック
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
        { error: "既に保存済みのクエストです" },
        { status: 409 }
      );
    }

    // 6) クエストを保存
    const savedQuest = await prisma.savedQuest.create({
      data: {
        user_id: user.id,
        quest_id: questId,
        saved_at: new Date(),
      },
      select: {
        id: true,
        saved_at: true,
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
      savedQuest,
    });
  } catch (error) {
    console.error("クエスト保存エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// DELETE: クエストの保存を解除
export async function DELETE(
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
        { error: "レート制限に達しました" },
        { status: 429 }
      );
    }

    // 2) セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId) || questId <= 0) {
      return NextResponse.json(
        { error: "無効なクエストIDです" },
        { status: 400 }
      );
    }

    // 3) ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 4) 保存されたクエストを削除
    const deletedSavedQuest = await prisma.savedQuest.deleteMany({
      where: {
        user_id: user.id,
        quest_id: questId,
      },
    });

    if (deletedSavedQuest.count === 0) {
      return NextResponse.json(
        { error: "保存されたクエストが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "クエストの保存を解除しました",
    });
  } catch (error) {
    console.error("クエスト保存解除エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
