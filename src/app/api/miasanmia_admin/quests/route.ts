export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { adminRateLimiter, withRateLimit } from "@/lib/rate-limit";

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
        { status: 429, headers: securityHeaders }
      );
    }

    // 2) セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401, headers: securityHeaders }
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
        { status: 403, headers: securityHeaders }
      );
    }

    // 4) クエリパラメータを取得・検証
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "20";
    const search = searchParams.get("search") || "";
    const questId = searchParams.get("questId") || "";
    const tagId = searchParams.get("tagId") || "";
    const sortBy = searchParams.get("sortBy") || "date_created";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 入力検証
    const page = parseInt(pageParam);
    const limit = parseInt(limitParam);

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "無効なページ番号です" },
        { status: 400, headers: securityHeaders }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "無効な制限数です（1-100の範囲で指定してください）" },
        { status: 400, headers: securityHeaders }
      );
    }

    // ソート順の検証
    const validSortFields = ["id", "title", "date_created", "location"];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: "無効なソートフィールドです" },
        { status: 400, headers: securityHeaders }
      );
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { error: "無効なソート順です" },
        { status: 400, headers: securityHeaders }
      );
    }

    // 5) フィルタ条件を構築
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
      id?: number;
      tags?: { some: { id: number } };
    } = {};

    // 検索フィルタ
    if (search.trim().length > 0) {
      const sanitizedSearch = search.trim();
      where.OR = [
        { title: { contains: sanitizedSearch, mode: "insensitive" } },
        { description: { contains: sanitizedSearch, mode: "insensitive" } },
      ];
    }

    // ID検索フィルタ
    if (questId.trim().length > 0) {
      const id = parseInt(questId.trim());
      if (!isNaN(id)) {
        where.id = id;
      }
    }

    // タグ検索フィルタ
    if (tagId.trim().length > 0) {
      const tagIdNum = parseInt(tagId.trim());
      if (!isNaN(tagIdNum)) {
        where.tags = { some: { id: tagIdNum } };
      }
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
          [sortBy]: sortOrder,
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
      { headers: securityHeaders }
    );
  } catch (error) {
    console.error("クエスト取得エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers: securityHeaders }
    );
  }
}
