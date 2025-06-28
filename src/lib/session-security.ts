// セッション情報のセキュリティ管理ユーティリティ

import { Session } from "next-auth";

// クライアントサイドで安全に使用できるセッション情報の型
export interface SafeSessionInfo {
  userEmail: string;
  userName: string | null | undefined;
  userImage: string | null | undefined;
}

// セッションから安全な情報のみを抽出
export function extractSafeSessionInfo(
  session: Session | null
): SafeSessionInfo | null {
  if (!session?.user) {
    return null;
  }

  return {
    userEmail: session.user.email || "",
    userName: session.user.name,
    userImage: session.user.image,
  };
}

// セッション情報が有効かチェック
export function isValidSession(session: Session | null): boolean {
  return !!session?.user?.email;
}

// 機密情報が含まれていないかチェック
export function containsSensitiveData(obj: Record<string, unknown>): boolean {
  const sensitiveKeys = [
    "id",
    "password",
    "token",
    "secret",
    "key",
    "credential",
    "access_token",
    "refresh_token",
    "id_token",
    "oauth_token",
    "sessionToken",
    "csrfToken",
  ];

  const checkObject = (item: unknown): boolean => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const objItem = item as Record<string, unknown>;
    for (const key of Object.keys(objItem)) {
      const lowerKey = key.toLowerCase();

      // 機密キーが含まれているかチェック
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        return true;
      }

      // ネストしたオブジェクトもチェック
      if (typeof objItem[key] === "object" && checkObject(objItem[key])) {
        return true;
      }
    }

    return false;
  };

  return checkObject(obj);
}

// セッション情報のログ出力を安全にする
export function safeLogSession(
  session: Session | null,
  context: string = "Session"
): void {
  if (process.env.NODE_ENV === "development") {
    const safeInfo = extractSafeSessionInfo(session);
    console.log(`${context}:`, {
      hasSession: !!session,
      userEmail: safeInfo?.userEmail ? "***@***.***" : "none",
      hasName: !!safeInfo?.userName,
      hasImage: !!safeInfo?.userImage,
    });
  }
}
