import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // スタッフ権限チェック
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isStaff: true },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const questId = parseInt(id);

    // クエストの存在確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // ファイル名を生成
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `quest_${questId}_${timestamp}.${fileExtension}`;

    // アップロードディレクトリを作成
    const uploadDir = join(process.cwd(), "public", "uploads", "quests");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイルを保存
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // データベースを更新
    const imageUrl = `/uploads/quests/${fileName}`;
    await prisma.quest.update({
      where: { id: questId },
      data: { imgUrl: imageUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
