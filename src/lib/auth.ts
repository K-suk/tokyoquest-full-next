import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

// 管理者権限チェック（admin系のpage.tsxやserver actionsで使用）
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isStaff: true },
  });

  if (!user?.isStaff) {
    redirect("/");
  }

  return session;
}

// API用の認証チェック
export async function requireAuthAPI() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return session;
}

// API用の管理者権限チェック
export async function requireAdminAPI() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isStaff: true },
  });

  if (!user?.isStaff) {
    throw new Error("Forbidden: Staff access required");
  }

  return session;
}

// ユーザー情報取得（安全な方法）
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      level: true,
      exp: true,
      email: true,
      isStaff: true,
    },
  });

  return user;
}
