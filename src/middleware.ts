// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// インメモリレート制限ストア
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// レート制限設定
const RATE_LIMIT_CONFIG = {
  // 一般APIエンドポイント
  general: { limit: 100, windowMs: 15 * 60 * 1000 }, // 15分で100リクエスト
  // 認証関連
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 15分で5リクエスト
  // ファイルアップロード
  upload: { limit: 10, windowMs: 60 * 60 * 1000 }, // 1時間で10リクエスト
  // 検索・クエスト取得
  quest: { limit: 50, windowMs: 5 * 60 * 1000 }, // 5分で50リクエスト
};

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

  // 開発環境での追加緩和（unsafe-evalは削除）
  if (!isProduction) {
    return baseCSP
      .map((directive) => {
        if (directive.startsWith("script-src")) {
          return (
            "script-src 'self' 'nonce-" +
            nonce +
            "' 'strict-dynamic' https: https://cdn.jsdelivr.net https://storage.googleapis.com"
          );
        }
        if (directive.startsWith("style-src")) {
          return "style-src 'self' 'nonce-" + nonce + "'";
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

// --- レート制限チェック関数 ---
function checkRateLimit(
  identifier: string,
  config: keyof typeof RATE_LIMIT_CONFIG
): boolean {
  const now = Date.now();
  const { limit, windowMs } = RATE_LIMIT_CONFIG[config];
  const key = `${identifier}:${config}`;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // 新しいウィンドウまたは初回アクセス
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false; // レート制限超過
  }

  // カウントを増加
  current.count++;
  return true;
}

// --- レート制限ヘッダーを追加する関数 ---
function addRateLimitHeaders(
  response: NextResponse,
  identifier: string,
  config: keyof typeof RATE_LIMIT_CONFIG
): void {
  const { limit, windowMs } = RATE_LIMIT_CONFIG[config];
  const key = `${identifier}:${config}`;
  const current = rateLimitStore.get(key);

  if (current) {
    const remaining = Math.max(0, limit - current.count);
    const resetTime = new Date(current.resetTime).toISOString();

    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime);
  }
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

  // レート制限の識別子を生成
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const identifier = `${ip}:${userAgent}`;

  // APIエンドポイントのレート制限チェック
  if (pathname.startsWith("/api/")) {
    let rateLimitConfig: keyof typeof RATE_LIMIT_CONFIG = "general";

    // エンドポイント別のレート制限設定
    if (pathname.includes("/auth") || pathname.includes("/login")) {
      rateLimitConfig = "auth";
    } else if (pathname.includes("/upload") || pathname.includes("/complete")) {
      rateLimitConfig = "upload";
    } else if (pathname.includes("/quests")) {
      rateLimitConfig = "quest";
    }

    if (!checkRateLimit(identifier, rateLimitConfig)) {
      const response = NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
      response.headers.set("x-nonce", nonce);
      addRateLimitHeaders(response, identifier, rateLimitConfig);
      return addSecurityHeaders(response, nonce, pathname);
    }
  }

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
