import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { authRateLimiter, withRateLimit } from "@/lib/rate-limit";

// セキュリティヘッダー
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
};

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

    // 3) リクエストボディからデータを取得
    const body = await request.json();
    const { level } = body;

    // 4) バリデーション
    if (typeof level !== "number" || level < 0 || level > 10) {
      return NextResponse.json(
        { error: "Invalid level value" },
        { status: 400, headers: securityHeaders }
      );
    }

    // 5) ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        level: level,
      },
      select: {
        id: true,
        name: true,
        level: true,
        exp: true,
        email: true,
      },
    });

    // 6) レベル1に更新された場合、ストーリープログレスを作成
    if (level === 1) {
      try {
        // 既存のストーリープログレスを確認
        const existingProgress = await prisma.storyProgress.findUnique({
          where: { userId: updatedUser.id },
        });

        if (!existingProgress) {
          // ストーリープログレスを作成し、レベル1をアンロック
          await prisma.storyProgress.create({
            data: {
              userId: updatedUser.id,
              unlockedLevels: [1],
              lastReadAtByLevel: {},
            },
          });
        } else if (!existingProgress.unlockedLevels.includes(1)) {
          // レベル1がまだアンロックされていない場合、追加
          await prisma.storyProgress.update({
            where: { id: existingProgress.id },
            data: {
              unlockedLevels: [...existingProgress.unlockedLevels, 1],
            },
          });
        }
      } catch (error) {
        console.error("ストーリープログレス作成エラー:", error);
        // エラーが発生してもユーザー更新は成功とする
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          name: updatedUser.name,
          level: updatedUser.level,
          exp: updatedUser.exp,
          email: updatedUser.email,
        },
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (error) {
    console.error("レベル更新エラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500, headers: securityHeaders }
    );
  }
}
