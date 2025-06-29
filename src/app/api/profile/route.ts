import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { authRateLimiter, withRateLimit } from "@/lib/rate-limit";

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

export async function GET(request: NextRequest) {
  try {
    // 1) レート制限チェック
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const rateLimitId = `${ip}:${userAgent}`;

    const { allowed } = withRateLimit(authRateLimiter, rateLimitId);
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

    // 3) ユーザー情報を取得（IDは除外）
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        level: true,
        exp: true,
        email: true, // 表示用のメールアドレス
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        user: user,
      },
      { headers }
    );
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1) レート制限チェック
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const rateLimitId = `${ip}:${userAgent}`;

    const { allowed } = withRateLimit(authRateLimiter, rateLimitId);
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

    // 3) リクエストボディからデータを取得
    const { name } = await request.json();

    // 4) 入力値検証を強化
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "名前は必須です" },
        { status: 400, headers }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "名前は空にできません" },
        { status: 400, headers }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "名前は100文字以内で入力してください" },
        { status: 400, headers }
      );
    }

    // 5) XSS対策: HTMLタグをエスケープ
    const sanitizedName = trimmedName
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    // 6) ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: sanitizedName,
      },
      select: {
        name: true,
        level: true,
        exp: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        user: updatedUser,
      },
      { headers }
    );
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers }
    );
  }
}
