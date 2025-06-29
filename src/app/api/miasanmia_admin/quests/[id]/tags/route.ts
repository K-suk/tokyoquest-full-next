import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { adminRateLimiter, withRateLimit } from "@/lib/rate-limit";

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

export async function PUT(
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

    const { allowed } = withRateLimit(adminRateLimiter, rateLimitId);
    if (!allowed) {
      return NextResponse.json(
        { error: "レート制限に達しました" },
        { status: 429, headers }
      );
    }

    // 2) セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401, headers }
      );
    }

    // 3) 管理者権限確認
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isStaff: true },
    });

    if (!user || !user.isStaff) {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403, headers }
      );
    }

    // 4) パラメータ取得・検証
    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId) || questId <= 0) {
      return NextResponse.json(
        { error: "無効なクエストIDです" },
        { status: 400, headers }
      );
    }

    // 5) リクエストボディからデータを取得・検証
    const { tagIds } = await request.json();

    if (!Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "tagIdsは配列である必要があります" },
        { status: 400, headers }
      );
    }

    // 6) タグIDの検証
    if (tagIds.length > 10) {
      return NextResponse.json(
        { error: "タグは最大10個まで設定できます" },
        { status: 400, headers }
      );
    }

    for (const tagId of tagIds) {
      if (typeof tagId !== "number" || tagId <= 0 || !Number.isInteger(tagId)) {
        return NextResponse.json(
          { error: "無効なタグIDが含まれています" },
          { status: 400, headers }
        );
      }
    }

    // 7) questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true },
    });

    if (!quest) {
      return NextResponse.json(
        { error: "クエストが見つかりません" },
        { status: 404, headers }
      );
    }

    // 8) 指定されたタグが存在するか確認
    const existingTags = await prisma.tag.findMany({
      where: {
        id: {
          in: tagIds,
        },
      },
      select: { id: true },
    });

    if (existingTags.length !== tagIds.length) {
      return NextResponse.json(
        { error: "存在しないタグが含まれています" },
        { status: 400, headers }
      );
    }

    // 9) 既存のtag関連付けを削除して新しい関連付けを作成
    await prisma.quest.update({
      where: { id: questId },
      data: {
        tags: {
          set: tagIds.map((tagId: number) => ({ id: tagId })),
        },
      },
    });

    // 10) 更新されたquestデータを取得
    const updatedQuest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        quest: updatedQuest,
      },
      { headers }
    );
  } catch (error) {
    console.error("クエストタグ更新エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers }
    );
  }
}
