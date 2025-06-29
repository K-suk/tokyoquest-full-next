import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { questRateLimiter, withRateLimit } from "@/lib/rate-limit";

// キャッシュを無効化
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

    // 4) 入力値検証を強化
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string") {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    // 5) コメントの長さと内容を検証
    const trimmedComment = comment.trim();
    if (trimmedComment.length === 0) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedComment.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be less than 1000 characters" },
        { status: 400 }
      );
    }

    // 6) XSS対策: HTMLタグをエスケープ
    const sanitizedComment = trimmedComment
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

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
        rating,
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
    const { id } = await params;
    const questId = parseInt(id);
    if (isNaN(questId)) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    // 1) questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 2) レビュー一覧を取得（セキュリティ強化）
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
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
