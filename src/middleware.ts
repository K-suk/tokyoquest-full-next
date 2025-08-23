// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// --- Nonce生成関数（Edge Runtime対応）---
function generateNonce() {
  // Edge Runtimeでも動作するようにcrypto.randomUUID()を使用
  // またはMath.random()を使った代替実装
  try {
    // crypto.randomUUID()が利用可能なら使用
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return btoa(crypto.randomUUID()).replace(/[+/=]/g, "").substring(0, 16);
    }
  } catch (error) {
    // cryptoが利用できない場合はMath.random()を使用
    console.warn("Crypto API not available, using Math.random() fallback");
  }

  // Fallback: Math.random()ベースのnonce生成
  const array = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...Array.from(array)))
    .replace(/[+/=]/g, "")
    .substring(0, 16);
}

// --- CSP生成関数 ---
function generateCSP(nonce: string, isProduction: boolean = false) {
  const baseCSP = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' https: data:",
    "connect-src 'self' https: wss:",
    "upgrade-insecure-requests",
  ];

  // 開発環境での追加緩和
  if (!isProduction) {
    return baseCSP
      .map((directive) => {
        if (directive.startsWith("script-src")) {
          return (
            "script-src 'self' 'unsafe-eval' 'nonce-" +
            nonce +
            "' 'strict-dynamic' https: https://cdn.jsdelivr.net https://storage.googleapis.com"
          );
        }
        if (directive.startsWith("style-src")) {
          return "style-src 'self' 'unsafe-inline' 'nonce-" + nonce + "'";
        }
        if (directive.startsWith("img-src")) {
          return "img-src 'self' data: https: blob:";
        }
        if (directive.startsWith("connect-src")) {
          return "connect-src 'self' https: wss:";
        }
        if (directive.startsWith("font-src")) {
          return "font-src 'self' https: data:";
        }
        return directive;
      })
      .join("; ");
  }

  return baseCSP.join("; ");
}

// --- ヘッダーを追加する関数 ---
function addSecurityHeaders(
  response: NextResponse,
  nonce: string,
  pathname?: string
) {
  const isProduction = process.env.NODE_ENV === "production";

  // Nonceをレスポンスヘッダーに設定
  response.headers.set("X-Nonce", nonce);

  // 基本セキュリティヘッダー
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HSTSは本番のみ
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Permissions-Policy（使用するAPIに応じて最小化）
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), hid=(), serial=()"
  );

  // CSP設定
  const csp = generateCSP(nonce, isProduction);
  response.headers.set("Content-Security-Policy", csp);

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

  // リクエストごとにnonceを生成
  const nonce = generateNonce();

  // ── 1) 静的アセット（画像やビルド成果物）は認証スキップ＆ヘッダー追加 ──
  if (
    pathname.startsWith("/images") ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next();
    // nonceをリクエストヘッダーに追加（Next.jsのレンダリングで使用）
    response.headers.set("x-nonce", nonce);
    return addSecurityHeaders(response, nonce, pathname);
  }

  // ── 2) ログイン済みユーザーのチェック ──
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── 3) ログイン済みユーザーが /login または / にアクセスした場合、/home にリダイレクト ──
  if (token && (pathname === "/login" || pathname === "/")) {
    const response = NextResponse.redirect(new URL("/home", request.url));
    response.headers.set("x-nonce", nonce);
    return addSecurityHeaders(response, nonce, pathname);
  }

  // ── 4) /login のボットチェック＋ヘッダー追加（未ログインユーザーのみ） ──
  if (pathname === "/login") {
    // ボット検出省略…
    const response = NextResponse.next();
    response.headers.set("x-nonce", nonce);
    return addSecurityHeaders(response, nonce, pathname);
  }

  // ── 5) /play, /privacy, /term, /sitemap.xml, /robots.txt ──
  if (
    pathname === "/play" ||
    pathname === "/privacy" ||
    pathname === "/term" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    const response = NextResponse.next();
    response.headers.set("x-nonce", nonce);
    return addSecurityHeaders(response, nonce, pathname);
  }

  // ── 6) 認証必須パス ──
  if (isProtectedPath(pathname)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.headers.set("x-nonce", nonce);
      return addSecurityHeaders(response, nonce, pathname);
    }
  }

  // ── 7) 上記以外は通常応答＋ヘッダー追加 ──
  const response = NextResponse.next();
  response.headers.set("x-nonce", nonce);
  return addSecurityHeaders(response, nonce, pathname);
}

export const config = {
  matcher: [
    // api, _next/static, _next/image, favicon.ico は除外
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
