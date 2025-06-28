import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isStaff: true },
    });

    console.log(`✅ User ${email} has been promoted to admin/staff`);
    console.log(`User ID: ${user.id}`);
    console.log(`Name: ${user.name || "No name"}`);
    console.log(`Staff status: ${user.isStaff}`);
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
  console.log("Usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

makeAdmin(email);
