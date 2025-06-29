import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// セキュリティトークンの検証
function validateSecurityToken(): boolean {
  const requiredToken = process.env.ADMIN_SECURITY_TOKEN;
  const providedToken = process.argv[3]; // 第3引数としてトークンを受け取る

  if (!requiredToken) {
    console.error("❌ ADMIN_SECURITY_TOKEN environment variable is not set");
    return false;
  }

  if (!providedToken) {
    console.error("❌ Security token is required");
    console.log(
      "Usage: npx tsx scripts/make-admin.ts <email> <security-token>"
    );
    return false;
  }

  if (providedToken !== requiredToken) {
    console.error("❌ Invalid security token");
    return false;
  }

  return true;
}

// 環境チェック
function validateEnvironment(): boolean {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ This script cannot be run in production environment");
    return false;
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    return false;
  }

  return true;
}

async function makeAdmin(email: string) {
  try {
    // セキュリティチェック
    if (!validateSecurityToken()) {
      process.exit(1);
    }

    if (!validateEnvironment()) {
      process.exit(1);
    }

    // ユーザーの存在確認
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isStaff: true },
    });

    if (!existingUser) {
      console.error(`❌ User with email ${email} not found`);
      console.log("💡 Make sure the user has logged in at least once");
      return;
    }

    if (existingUser.isStaff) {
      console.log(`ℹ️ User ${email} is already an admin/staff`);
      console.log(`User ID: ${existingUser.id}`);
      console.log(`Name: ${existingUser.name || "No name"}`);
      return;
    }

    // 管理者権限を付与
    const user = await prisma.user.update({
      where: { email },
      data: { isStaff: true },
    });

    console.log(`✅ User ${email} has been promoted to admin/staff`);
    console.log(`User ID: ${user.id}`);
    console.log(`Name: ${user.name || "No name"}`);
    console.log(`Staff status: ${user.isStaff}`);

    // セキュリティログ
    console.log(
      `🔒 [SECURITY] Admin promotion: ${email} at ${new Date().toISOString()}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      console.error(`❌ User with email ${email} not found`);
    } else {
      console.error("❌ Error updating user:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: npx tsx scripts/make-admin.ts <email> <security-token>");
  process.exit(1);
}

makeAdmin(email);
