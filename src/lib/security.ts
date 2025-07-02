// セキュリティヘルパー関数
// APIルート用のセキュリティ機能

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import {
  withRateLimit,
  questRateLimiter,
  authRateLimiter,
  adminRateLimiter,
  RateLimiter,
} from "./rate-limit";
import { validateInput, questIdSchema } from "./validation";
import { Session } from "next-auth";
import crypto from "crypto";

// セキュリティヘッダー
export const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Permitted-Cross-Domain-Policies": "none",
};

// ユーザー情報の型定義
interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  isStaff: boolean;
}

// 認証チェック
export async function requireAuth(): Promise<
  | { success: true; session: Session; user: UserInfo }
  | { success: false; response: NextResponse }
> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "認証が必要です" },
          { status: 401, headers: securityHeaders }
        ),
      };
    }

    // ユーザー情報を取得
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        isStaff: true,
      },
    });

    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "ユーザーが見つかりません" },
          { status: 404, headers: securityHeaders }
        ),
      };
    }

    return { success: true, session, user };
  } catch (error) {
    console.error("認証エラー:", error);
    return {
      success: false,
      response: NextResponse.json(
        { error: "認証エラーが発生しました" },
        { status: 500, headers: securityHeaders }
      ),
    };
  }
}

// レート制限チェック
export function checkRateLimit(
  request: NextRequest,
  rateLimiter: any,
  identifier?: string
): { success: true } | { success: false; response: NextResponse } {
  const clientIP =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const rateLimitId = identifier || `${clientIP}:${userAgent}`;

  const { allowed, remaining, resetTime } = withRateLimit(
    rateLimiter,
    rateLimitId
  );

  if (!allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "レート制限に達しました",
          remaining: 0,
          resetTime: new Date(resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            ...securityHeaders,
            "X-RateLimit-Limit": rateLimiter.maxRequests.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(resetTime).toISOString(),
            "Retry-After": Math.ceil(
              (resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      ),
    };
  }

  return { success: true };
}

// 入力検証
export function validateRequest<T>(
  request: NextRequest,
  schema: any
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const body = request.body ? request.json() : {};
    const result = validateInput(schema, body);

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: result.error },
          { status: 400, headers: securityHeaders }
        ),
      };
    }

    return { success: true, data: result.data as T };
  } catch (error) {
    console.error("入力検証エラー:", error);
    return {
      success: false,
      response: NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400, headers: securityHeaders }
      ),
    };
  }
}

// 管理者権限チェック
export async function requireAdmin(): Promise<
  | { success: true; session: Session; user: UserInfo }
  | { success: false; response: NextResponse }
> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  const { session, user } = authResult;

  // 管理者権限チェック（isStaffフィールドを使用）
  if (!user.isStaff) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403, headers: securityHeaders }
      ),
    };
  }

  return { success: true, session, user };
}

// セキュアなレスポンス作成
export function createSecureResponse(
  data: Record<string, unknown>,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: securityHeaders,
  });
}

// エラーレスポンス作成
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: securityHeaders }
  );
}

// ログ出力（セキュリティ監査用）
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  request: NextRequest
): void {
  const clientIP =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const timestamp = new Date().toISOString();

  // 本番環境では詳細ログを制限
  const logDetails =
    process.env.NODE_ENV === "production"
      ? { ip: clientIP, event, url: request.url, method: request.method }
      : {
          ip: clientIP,
          userAgent,
          details,
          url: request.url,
          method: request.method,
        };

  console.log(`🔒 [SECURITY] ${timestamp} - ${event}`, logDetails);
}

// CORS設定
export const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// セキュアなAPIハンドラー作成
export function createSecureApiHandler(
  handler: (
    request: NextRequest & { user?: UserInfo }
  ) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimiter?: RateLimiter;
    validateSchema?: any;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // レート制限チェック
      if (options.rateLimiter) {
        const rateLimitResult = checkRateLimit(request, options.rateLimiter);
        if (!rateLimitResult.success) {
          return rateLimitResult.response;
        }
      }

      // 認証チェック
      let user: UserInfo | null = null;
      if (options.requireAuth || options.requireAdmin) {
        const authResult = options.requireAdmin
          ? await requireAdmin()
          : await requireAuth();

        if (!authResult.success) {
          return authResult.response;
        }

        user = authResult.user;
      }

      // 入力検証
      if (options.validateSchema) {
        const validationResult = validateRequest(
          request,
          options.validateSchema
        );
        if (!validationResult.success) {
          return validationResult.response;
        }
      }

      // ユーザー情報をリクエストに追加
      const requestWithUser = request as NextRequest & { user?: UserInfo };
      requestWithUser.user = user || undefined;

      // メインハンドラー実行
      return await handler(requestWithUser);
    } catch (error) {
      console.error("API エラー:", error);
      logSecurityEvent(
        "API_ERROR",
        { error: (error as Error).message },
        request
      );
      return createErrorResponse("内部サーバーエラーが発生しました", 500);
    }
  };
}

// エクスポート
export { questRateLimiter, authRateLimiter, adminRateLimiter, questIdSchema };

// CSRF対策
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  // セッショントークンとCSRFトークンの組み合わせを検証
  const expectedToken = crypto
    .createHash("sha256")
    .update(sessionToken + process.env.NEXTAUTH_SECRET)
    .digest("hex");

  return token === expectedToken;
}

// CSRFトークンをレスポンスヘッダーに追加
export function addCSRFTokenToHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return {
    ...headers,
    "X-CSRF-Token": generateCSRFToken(),
  };
}
