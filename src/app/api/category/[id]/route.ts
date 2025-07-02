import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NextRequest, NextResponse } from "next/server";
import { questRateLimiter, withRateLimit } from "@/lib/rate-limit";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Prisma接続確認
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "データベース接続エラーが発生しました" },
        { status: 503, headers: securityHeaders }
      );
    }
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
        { status: 429, headers: securityHeaders }
      );
    }

    const { id } = await params;
    const session = await getServerSession(authOptions);

    // 2) 入力検証
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { error: "カテゴリIDは必須です" },
        { status: 400, headers: securityHeaders }
      );
    }

    const sanitizedId = id.trim();

    // 3) 並列でデータを取得してパフォーマンスを向上
    const [quests, tag, savedQuests] = await Promise.all([
      // クエストを取得（必要なフィールドのみ選択）
      prisma.quest.findMany({
        where: {
          tags: {
            some: {
              name: sanitizedId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          imgUrl: true,
          date_created: true,
        },
        orderBy: {
          date_created: "desc",
        },
      }),
      // タグ情報を取得
      prisma.tag.findFirst({
        where: { name: sanitizedId },
        select: {
          name: true,
          description: true,
        },
      }),
      // ログイン済みの場合のみ保存済みクエストを取得
      session?.user?.email
        ? prisma.savedQuest.findMany({
            where: {
              user: {
                email: session.user.email,
              },
            },
            select: {
              quest_id: true,
            },
          })
        : Promise.resolve([]),
    ]);

    if (!tag) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404, headers: securityHeaders }
      );
    }

    // 4) 保存済みクエストのID配列を作成
    const savedQuestIds = savedQuests.map((sq) => sq.quest_id);

    return NextResponse.json(
      {
        quests,
        tag,
        savedQuestIds,
      },
      { headers: securityHeaders }
    );
  } catch (error) {
    console.error("カテゴリデータ取得エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers: securityHeaders }
    );
  }
}
