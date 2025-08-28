// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// --- ヘッダーを追加する関数 ---
function addSecurityHeaders(response: NextResponse, pathname?: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // playページ用の特別なCSP設定
  if (pathname === "/play") {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://storage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:;"
    );
  } else {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: https://www.google-analytics.com https://analytics.google.com; worker-src 'self' blob:;"
    );
  }
  return response;
}

// 保護対象パスと公開パスはそのまま使います
const protectedPaths = [
  "/home",
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
const publicPaths = [
  "/privacy",
  "/term",
  "/images",
  "/sitemap.xml",
  "/robots.txt",
]; // /と/loginを削除

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
    return addSecurityHeaders(NextResponse.next(), pathname);
  }

  // ── 2) ログイン済みユーザーのチェック ──
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── 3) ログイン済みユーザーが /login または / にアクセスした場合、/home にリダイレクト ──
  if (token && (pathname === "/login" || pathname === "/")) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL("/home", request.url)),
      pathname
    );
  }

  // ── 4) /login のボットチェック＋ヘッダー追加（未ログインユーザーのみ） ──
  if (pathname === "/login") {
    // ボット検出省略…
    const response = NextResponse.next();
    return addSecurityHeaders(response, pathname);
  }

  // ── 5) /play, /privacy, /term, /sitemap.xml, /robots.txt ──
  if (
    pathname === "/play" ||
    pathname === "/privacy" ||
    pathname === "/term" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return addSecurityHeaders(NextResponse.next(), pathname);
  }

  // ── 6) 認証必須パス ──
  if (isProtectedPath(pathname)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl), pathname);
    }
  }

  // ── 7) 上記以外は通常応答＋ヘッダー追加 ──
  return addSecurityHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    // api, _next/static, _next/image, favicon.ico は除外
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
