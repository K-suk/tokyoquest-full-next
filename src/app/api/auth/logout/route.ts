import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { securityLogger } from "@/lib/logger";
import { invalidateSession } from "@/lib/session-security";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const userId =
      typeof body.userId === "string"
        ? body.userId.substring(0, 100)
        : undefined;
    const reason =
      typeof body.reason === "string"
        ? body.reason.substring(0, 200)
        : undefined;

    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // セッション情報を取得
    const sessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (sessionToken) {
      // セッションを無効化
      invalidateSession(sessionToken, reason || "user_logout");
    }

    // セキュリティログに記録
    securityLogger.logSessionSecurityEvent(
      clientIP,
      userAgent,
      userId || session?.user?.email || "unknown",
      "LOGOUT",
      {
        reason: reason || "user_logout",
        sessionToken: sessionToken ? "***" : "none",
        userEmail: session?.user?.email || "unknown",
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
