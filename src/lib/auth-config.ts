import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { AuthOptions } from "next-auth";
import { randomUUID } from "crypto";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24時間
    updateAge: 60 * 60, // 1時間ごとに更新
  },
  secret: process.env.NEXTAUTH_SECRET || "placeholder-secret-for-build",
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;
      if (account.provider !== "google") return false;

      // email_verifiedがbooleanでtrueかどうかを型安全に判定
      if (
        typeof (profile as { email_verified?: unknown }).email_verified !==
          "boolean" ||
        !(profile as { email_verified: boolean }).email_verified
      ) {
        return false;
      }

      // メールアドレスの検証
      const email = (profile as { email?: string }).email;
      if (!email || typeof email !== "string") {
        return false;
      }

      // セッション固定化対策: 新しいセッションIDを生成
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          name: token.name || session.user.name,
          email: token.email || session.user.email,
          image: token.picture || session.user.image,
        };
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // セッション固定化対策: ログイン時に新しいトークンを生成
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.iat = Math.floor(Date.now() / 1000); // 発行時刻を更新
        token.jti = randomUUID(); // 一意のトークンIDを生成
        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24時間有効期限
        token.sessionId = randomUUID(); // セッション固有ID
      }

      // 既存トークンの有効期限チェック
      if (token.exp && token.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired");
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 24時間
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1時間
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1時間
      },
    },
  },
  // セキュリティ設定
  jwt: {
    maxAge: 24 * 60 * 60, // 24時間
  },
};
