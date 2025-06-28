import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 認証が不要なパス（パブリックパス）
const publicPaths = [
  "/login",
  "/api/auth",
  "/favicon.ico",
  "/images",
  "/_next",
  "/api/webhooks",
];

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

// パスがパブリックかどうかをチェック
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

// パスが保護されているかどうかをチェック
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ログインページへのアクセスの場合
  if (pathname === "/login") {
    try {
      // JWTトークンを検証
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // トークンが存在する場合（既にログイン済み）
      if (token) {
        console.log(
          `🔄 Redirecting logged-in user from login page to main page`
        );
        return NextResponse.redirect(new URL("/", request.url));
      }

      // 未ログインの場合はログインページを表示
      return NextResponse.next();
    } catch (error) {
      console.error("❌ Middleware authentication error on login page:", error);
      // エラーが発生した場合はログインページを表示
      return NextResponse.next();
    }
  }

  // パブリックパスの場合は認証チェックをスキップ
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 保護されたパスまたはその他のパスの場合、認証チェックを実行
  if (isProtectedPath(pathname) || pathname !== "/login") {
    try {
      // JWTトークンを検証
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // トークンが存在しない場合（未認証）
      if (!token) {
        console.log(`🔒 Unauthorized access attempt to: ${pathname}`);
        const loginUrl = new URL("/login", request.url);
        // 元のURLをクエリパラメータとして保存
        loginUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(loginUrl);
      }

      // 認証済みの場合は次の処理に進む
      console.log(`✅ Authorized access to: ${pathname}`);
      return NextResponse.next();
    } catch (error) {
      console.error("❌ Middleware authentication error:", error);

      // エラーが発生した場合もログインページにリダイレクト
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // その他のパスも認証を要求
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - api/webhooks (webhook endpoints)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images|api/webhooks).*)",
  ],
};
