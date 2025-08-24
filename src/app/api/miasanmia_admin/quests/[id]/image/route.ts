import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { fileTypeFromBuffer } from "file-type";

// 擬似ウイルススキャン関数（実際の実装ではClamAV等に置き換え）
async function performPseudoVirusScan(
  buffer: Buffer
): Promise<{ safe: boolean; reason?: string }> {
  // 基本的なチェック
  const fileSize = buffer.length;

  // ファイルサイズチェック
  if (fileSize === 0) {
    return { safe: false, reason: "Empty file" };
  }

  // 疑わしいパターンチェック（簡易的）
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /<%/i,
    /%>/i,
  ];

  // ファイルが画像として適切かチェック
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType) {
    return { safe: false, reason: "Invalid file format" };
  }

  // JPEG/PNG/GIF/WebPの基本構造チェック
  const firstBytes = buffer
    .subarray(0, Math.min(64, buffer.length))
    .toString("hex");

  // 実際のウイルススキャンに置き換えるまでの一時的なチェック
  // 本番環境では必ず真のAVスキャナーを実装すること
  for (const pattern of suspiciousPatterns) {
    if (
      pattern.test(buffer.toString("utf8", 0, Math.min(1024, buffer.length)))
    ) {
      return { safe: false, reason: "Suspicious content detected" };
    }
  }

  return { safe: true };
}

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

    // Content-Lengthチェック（サイズ制限）
    const contentLength = request.headers.get("content-length");
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    // ファイルサイズチェック（実サイズ）
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 413 }
      );
    }

    // MIMEタイプチェック（宣言されたタイプ）
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    // ファイルバッファ取得
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイルシグネチャチェック（file-typeによるマジックバイト検証）
    const detectedType = await fileTypeFromBuffer(buffer);
    if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      );
    }

    // MIMEタイプ整合性チェック
    if (file.type !== detectedType.mime) {
      return NextResponse.json(
        { error: "File type mismatch between declaration and content" },
        { status: 400 }
      );
    }

    // 拡張子チェック
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const originalFileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) =>
      originalFileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }

    // ファイル名サニタイズ
    const timestamp = Date.now();
    const fileExtension = detectedType.ext; // 検出された拡張子を使用
    const sanitizedFileName = `quest_${questId}_${timestamp}.${fileExtension}`;

    // 擬似ウイルススキャン（実際の実装ではClamAV等に置き換え）
    const virusScanResult = await performPseudoVirusScan(buffer);
    if (!virusScanResult.safe) {
      return NextResponse.json(
        { error: "File failed security scan" },
        { status: 400 }
      );
    }

    // Supabase Storageにアップロード（privateバケット）
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.storage
      .from("quest-images") // このバケットはprivateに設定されていること
      .upload(sanitizedFileName, buffer, {
        contentType: detectedType.mime,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload image to storage" },
        { status: 500 }
      );
    }

    // 署名付きURLを生成（セキュリティ強化）
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("quest-images")
      .createSignedUrl(sanitizedFileName, 60 * 60 * 24 * 7); // 7日間有効

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate secure image URL" },
        { status: 500 }
      );
    }

    // データベースを更新（署名付きURLを保存）
    await prisma.quest.update({
      where: { id: questId },
      data: { imgUrl: signedUrlData.signedUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl: signedUrlData.signedUrl,
      message: "Image uploaded and secured successfully",
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
