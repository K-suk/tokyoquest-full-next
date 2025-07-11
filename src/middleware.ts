// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// --- ヘッダーを追加する関数 ---
function addSecurityHeaders(response: NextResponse) {
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
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  return response;
}

// 保護対象パスと公開パスはそのまま使います
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
const publicPaths = ["/login", "/privacy", "/term", "/images"]; // images を追加

function isProtectedPath(pathname: string): boolean {
  if (publicPaths.some((p) => pathname.startsWith(p))) return false;
  return protectedPaths.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1) 静的アセット（画像やビルド成果物）は認証スキップ＆ヘッダー追加 ──
  if (
    pathname.startsWith("/images") ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── 2) /login のボットチェック＋ヘッダー追加 ──
  if (pathname === "/login") {
    // ボット検出省略…
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // ── 3) /privacy, /term ──
  if (pathname === "/privacy" || pathname === "/term") {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── 4) 認証必須パス ──
  if (isProtectedPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // ── 5) ログイン済みユーザーが /login に来たらルートへ ──
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/", request.url))
      );
    }
  }

  // ── 6) 上記以外は通常応答＋ヘッダー追加 ──
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    // api, _next/static, _next/image, favicon.ico は除外
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
