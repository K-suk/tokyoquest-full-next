export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { apiRateLimiter } from "@/lib/rate-limit";
import { fileTypeFromBuffer } from "file-type";
import { securityLogger } from "@/lib/logger";

// キャッシュを無効化
export const dynamic = "force-dynamic";

// セキュリティヘッダー
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let questId: number | null = null;

  try {
    // 1) レート制限チェック
    const rateLimitResult = apiRateLimiter.checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // 2) セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    questId = parseInt(id);
    if (isNaN(questId) || questId <= 0) {
      return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    // 3) ユーザー情報を取得（セキュリティ強化）
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, exp: true, level: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4) リクエストボディからデータを取得
    const { imageData } = await request.json();

    // 5) 入力値検証を強化
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Media data is required" },
        { status: 400 }
      );
    }

    // 6) Base64データの検証（画像または動画）
    const isImage = imageData.startsWith("data:image/");
    const isVideo = imageData.startsWith("data:video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Invalid media format. Only images and videos are allowed." },
        { status: 400 }
      );
    }

    // 7) データサイズの制限（5MB for images, 動画は無効化）
    if (isVideo) {
      return NextResponse.json(
        { error: "Video uploads are not allowed" },
        { status: 400 }
      );
    }

    const base64Data = imageData.split(",")[1];
    const dataSize = Math.ceil((base64Data.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024; // 5MB制限
    const maxSizeMB = 5;

    if (dataSize > maxSize) {
      return NextResponse.json(
        { error: `Image size must be less than ${maxSizeMB}MB` },
        { status: 413 }
      );
    }

    // 8) Base64データのサイズ制限とデコード
    if (base64Data.length > 50 * 1024 * 1024) {
      // 50MB制限
      return NextResponse.json(
        { error: "Media data too large" },
        { status: 413 }
      );
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, "base64");

      // デコード後のバッファサイズ検証
      if (buffer.length > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Decoded media too large" },
          { status: 413 }
        );
      }

      // 9) マジックバイト検証（ファイル署名）
      const fileSignature = buffer.slice(0, 8);
      const allowedSignatures = [
        Buffer.from([0xff, 0xd8, 0xff]), // JPEG
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG
        Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
        Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
        Buffer.from([0x52, 0x49, 0x46, 0x46]), // WebP (RIFF)
      ];

      const isValidSignature = allowedSignatures.some((signature) =>
        fileSignature.slice(0, signature.length).equals(signature)
      );

      if (!isValidSignature) {
        securityLogger.logFileUploadViolation(
          request.headers.get("x-forwarded-for") || "unknown",
          request.headers.get("user-agent") || "unknown",
          "invalid_magic_bytes",
          "Invalid file signature detected"
        );
        return NextResponse.json(
          { error: "Invalid file format" },
          { status: 400 }
        );
      }
    } catch (error) {
      securityLogger.logFileUploadViolation(
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown",
        "base64_decode_failed",
        "Failed to decode base64 data"
      );
      return NextResponse.json(
        { error: "Invalid media data format" },
        { status: 400 }
      );
    }

    // 9) MIMEタイプ検証（file-typeによるチェック）
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType) {
      securityLogger.logFileUploadViolation(
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown",
        "invalid_file_signature",
        "File signature validation failed"
      );
      return NextResponse.json(
        { error: "Invalid file format detected" },
        { status: 400 }
      );
    }

    // 10) 許可されたMIMEタイプのチェック
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (isImage && !allowedImageTypes.includes(detectedType.mime)) {
      securityLogger.logFileUploadViolation(
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown",
        `disallowed_image_type_${detectedType.mime}`,
        "Disallowed image MIME type"
      );
      return NextResponse.json(
        { error: `Image type ${detectedType.mime} is not allowed` },
        { status: 400 }
      );
    }

    if (isVideo && !allowedVideoTypes.includes(detectedType.mime)) {
      securityLogger.logFileUploadViolation(
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown",
        `disallowed_video_type_${detectedType.mime}`,
        "Disallowed video MIME type"
      );
      return NextResponse.json(
        { error: `Video type ${detectedType.mime} is not allowed` },
        { status: 400 }
      );
    }

    // 11) 拡張子とMIMEタイプの整合性チェック
    const expectedMimeType = isImage
      ? `image/${detectedType.ext}`
      : `video/${detectedType.ext}`;
    if (detectedType.mime !== expectedMimeType) {
      securityLogger.logFileUploadViolation(
        request.headers.get("x-forwarded-for") || "unknown",
        request.headers.get("user-agent") || "unknown",
        "mime_extension_mismatch",
        `MIME type ${detectedType.mime} doesn't match extension ${detectedType.ext}`
      );
      return NextResponse.json(
        { error: "File extension and content type mismatch" },
        { status: 400 }
      );
    }

    // 8) questが存在するか確認
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    // 9) 既に完了済みかチェック
    const existingCompletion = await prisma.questCompletion.findFirst({
      where: {
        user_id: user.id,
        quest_id: questId,
      },
      select: { id: true },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: "Quest already completed" },
        { status: 409 }
      );
    }

    // 10) クエスト完了を記録
    const completion = await prisma.questCompletion.create({
      data: {
        user_id: user.id,
        quest_id: questId,
        media: imageData,
      },
      select: {
        id: true,
        completion_date: true,
      },
    });

    // 11) 経験値を追加（レベルアップロジックは別途実装）
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        exp: {
          increment: 100, // 仮の経験値
        },
      },
      select: {
        exp: true,
        level: true,
      },
    });

    return NextResponse.json({
      success: true,
      completion: {
        id: completion.id,
        completion_date: completion.completion_date,
      },
      user: {
        exp: updatedUser.exp,
        level: updatedUser.level,
      },
    });
  } catch (error) {
    // エラーログ記録（機密情報を除外）
    console.error("Quest completion error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      questId: questId || "unknown",
      timestamp: new Date().toISOString(),
    });

    // 汎用的なエラーメッセージのみを返す
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
