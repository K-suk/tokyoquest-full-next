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

    // 4) tagデータを取得
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            quests: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      {
        tags: tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          description: tag.description,
          created_at: tag.created_at,
          questCount: tag._count.quests,
        })),
      },
      { headers: securityHeaders }
    );
  } catch (error) {
    console.error("タグ取得エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers: securityHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // 4) リクエストボディからデータを取得
    const { name, description } = await request.json();

    // 5) 入力値検証を強化
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "タグ名は必須です" },
        { status: 400, headers: securityHeaders }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: "タグ名は50文字以内で入力してください" },
        { status: 400, headers: securityHeaders }
      );
    }

    // 6) 説明文の検証
    let sanitizedDescription = null;
    if (description && typeof description === "string") {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 200) {
        return NextResponse.json(
          { error: "説明文は200文字以内で入力してください" },
          { status: 400, headers: securityHeaders }
        );
      }
      // XSS対策: HTMLタグをエスケープ
      sanitizedDescription = trimmedDescription
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }

    // 7) 新しいtagを作成
    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
        description: sanitizedDescription,
      },
    });

    return NextResponse.json(
      {
        success: true,
        tag: {
          id: tag.id,
          name: tag.name,
          description: tag.description,
          created_at: tag.created_at,
          questCount: 0,
        },
      },
      { headers: securityHeaders }
    );
  } catch (error) {
    console.error("タグ作成エラー:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "タグ名が既に存在します" },
        { status: 409, headers: securityHeaders }
      );
    }
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers: securityHeaders }
    );
  }
}
