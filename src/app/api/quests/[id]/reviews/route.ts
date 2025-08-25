export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { apiRateLimiter } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validation";
import { securityLogger } from "@/lib/logger";
import { SecurityTests } from "@/lib/security-tests";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1) レート制限チェック
    const rateLimitResult = apiRateLimiter.checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many review submissions" },
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

    // 3) リクエストボディからデータを取得
    const { rating, comment } = await request.json();

    // 4) セキュリティチェック（攻撃パターンの検出）
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // XSS攻撃の検出
    if (SecurityTests.detectXSS(comment)) {
      securityLogger.logXssAttempt(
        clientIP,
        userAgent,
        comment,
        "review-submission"
      );
      return NextResponse.json(
        { error: "Comment contains potentially dangerous content" },
        { status: 400 }
      );
    }

    // SQLインジェクション攻撃の検出
    if (SecurityTests.detectSQLInjection(comment)) {
      securityLogger.logSqlInjectionAttempt(
        clientIP,
        userAgent,
        comment,
        "review-submission"
      );
      return NextResponse.json(
        { error: "Comment contains potentially dangerous SQL patterns" },
        { status: 400 }
      );
    }

    // 5) Zodスキーマによる厳格な入力検証
    let validatedData;
    let sanitizedComment;

    try {
      // 入力データの型チェック
      if (typeof rating !== "number" || typeof comment !== "string") {
        return NextResponse.json(
          {
            error:
              "Invalid data types. Rating must be a number and comment must be a string.",
          },
          { status: 400 }
        );
      }

      validatedData = reviewSchema.parse({ rating, comment });

      // 6) XSS対策: HTMLタグをエスケープ
      sanitizedComment = validatedData.comment
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/&/g, "&amp;");
    } catch (error) {
      if (error instanceof Error) {
        // セキュリティログに記録
        securityLogger.logAnomalousRequest(
          clientIP,
          userAgent,
          "review-submission",
          "validation_failed",
          { error: error.message, rating, comment: comment.substring(0, 100) }
        );
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    // 7) questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 8) ユーザー情報を取得（セキュリティ強化）
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 9) ユーザーが既にレビューを投稿しているかチェック
    const existingReview = await prisma.review.findFirst({
      where: {
        quest_id: questId,
        user_id: user.id,
      },
      select: { id: true },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this quest" },
        { status: 409 }
      );
    }

    // 10) レビューを作成
    const review = await prisma.review.create({
      data: {
        quest_id: questId,
        user_id: user.id,
        rating: validatedData.rating,
        comment: sanitizedComment,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // 11) セキュリティログに記録（正常な投稿）
    securityLogger.log({
      event: "REVIEW_CREATED",
      severity: "low",
      details: {
        questId,
        userId: user.id,
        rating: validatedData.rating,
        commentLength: sanitizedComment.length,
      },
      ip: clientIP,
      userAgent,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user: {
          name: review.user.name,
        },
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1) レート制限チェック
    const rateLimitResult = apiRateLimiter.checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many review requests" },
        { status: 429 }
      );
    }

    const { id } = await params;
    const questId = parseInt(id);

    if (isNaN(questId)) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    // 2) questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 3) ページネーションとセキュリティ制限
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20"))
    );
    const offset = (page - 1) * limit;

    // 4) レビュー一覧を取得（セキュリティ強化）
    const reviews = await prisma.review.findMany({
      where: {
        quest_id: questId,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip: offset,
    });

    // 5) 総レビュー数を取得
    const totalReviews = await prisma.review.count({
      where: {
        quest_id: questId,
      },
    });

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user: {
          name: review.user.name || "Anonymous",
        },
      })),
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
