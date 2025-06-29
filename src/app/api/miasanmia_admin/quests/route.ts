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

export async function GET(request: NextRequest) {
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

    // 4) クエリパラメータを取得・検証
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "20";
    const search = searchParams.get("search") || "";

    // 入力検証
    const page = parseInt(pageParam);
    const limit = parseInt(limitParam);

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "無効なページ番号です" },
        { status: 400, headers }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "無効な制限数です（1-100の範囲で指定してください）" },
        { status: 400, headers }
      );
    }

    // 5) フィルタ条件を構築
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (search.trim().length > 0) {
      const sanitizedSearch = search.trim();
      where.OR = [
        { title: { contains: sanitizedSearch, mode: "insensitive" } },
        { description: { contains: sanitizedSearch, mode: "insensitive" } },
      ];
    }

    // 6) ページネーション計算
    const skip = (page - 1) * limit;

    // 7) questデータを取得
    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          date_created: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.quest.count({ where }),
    ]);

    return NextResponse.json(
      {
        quests: quests.map((quest) => ({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          tips: quest.tips,
          imgUrl: quest.imgUrl,
          location: quest.location,
          badget: quest.badget,
          date_created: quest.date_created,
          tags: quest.tags,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("クエスト取得エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers }
    );
  }
}
