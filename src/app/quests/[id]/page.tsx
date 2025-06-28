import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { toQuestDTO } from "@/lib/dto";
import QuestDetailClient from "./components/QuestDetailClient";

// キャッシュを無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// セキュリティヘッダー
export const headers = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

interface QuestDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function QuestDetailPage({ params }: QuestDetailPageProps) {
    // 1) 認証チェック（セッション情報は露出させない）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    const { id } = await params;
    const questId = parseInt(id, 10);

    if (isNaN(questId)) {
        notFound();
    }

    // 2) クエストデータを取得（必要なフィールドのみ）
    const quest = await prisma.quest.findUnique({
        where: { id: questId },
        select: {
            id: true,
            title: true,
            description: true,
            imgUrl: true,
            badget: true,
            location: true,
            tips: true,
        },
    });

    if (!quest) {
        notFound();
    }

    // 3) DTOに変換してClient Componentに渡す（セキュリティ強化）
    const questDTO = toQuestDTO(quest);

    // 4) 安全なメタデータ構造を作成
    const questMeta = {
        ...questDTO,
        imgUrl: questDTO.imgUrl ?? "",
        badget: quest.badget ?? undefined,
        location: quest.location ?? undefined,
        tips: quest.tips ?? undefined,
        // 外部URLは安全なデフォルト値を使用
        officialUrl: undefined,
        exampleUrl: undefined,
    };

    return <QuestDetailClient questMeta={questMeta} questId={questId} />;
}
