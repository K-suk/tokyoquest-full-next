import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 保護されたパス（認証必須）
const protectedPaths = [
  "/",
  "/category",
  "/miasanmia_admin",
  "/profile",
  "/quests",
  "/saved_quests",
  "/api/miasanmia_admin",
  "/api/quests",
  "/api/profile",
  "/api/saved-quests",
];

// パスが保護されているかどうかをチェック
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

// ログインページのセキュリティチェック
function validateLoginRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";

  // ボットの検出
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  if (botPatterns.some((pattern) => pattern.test(userAgent))) {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ログインページのセキュリティチェック
  if (pathname === "/login") {
    if (!validateLoginRequest(request)) {
      return NextResponse.json(
        { error: "アクセスが拒否されました" },
        { status: 403 }
      );
    }

    // セキュリティヘッダーを追加
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
    );

    return response;
  }

  // 既存の認証チェック
  if (isProtectedPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 既にログインしているユーザーがログインページにアクセスした場合
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
