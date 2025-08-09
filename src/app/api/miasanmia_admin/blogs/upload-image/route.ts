import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Supabaseクライアントを動的に初期化
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum 5MB allowed." },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // ファイル名を生成
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `blog-images/${timestamp}.${fileExtension}`;

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from("quest-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from("quest-images")
      .getPublicUrl(fileName);

    return NextResponse.json({
      imageUrl: urlData.publicUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading blog image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
