import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// 基本的な認証チェック（page.tsxやserver actionsで使用）
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  return session;
}

// ユーザー情報取得（ID含む）
export async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

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
    redirect("/login");
  }

  return user;
}

// 管理者権限チェック
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

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
    redirect("/login");
  }

  if (!user.isStaff) {
    redirect("/");
  }

  return user;
}

// セッション情報取得（リダイレクトなし）
export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}
