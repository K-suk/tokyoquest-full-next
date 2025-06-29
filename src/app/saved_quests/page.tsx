import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toQuestDTO } from "@/lib/dto";
import SavedQuestsClient from "./components/SavedQuestsClient";

// キャッシュ設定を最適化
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

// ブラウザのキャッシュを無効化
export const metadata = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export default async function SavedQuestsPage() {
    // 1) サーバーセッションをチェック（セッション情報は露出させない）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    // 2) ユーザーIDを取得
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        redirect("/login");
    }

    // 3) 保存済みクエストを取得（セキュリティ強化）
    const savedQuests = await prisma.savedQuest.findMany({
        where: {
            user_id: user.id, // 自分の保存済みクエストのみ
        },
        select: {
            id: true,
            saved_at: true,
            quest: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    imgUrl: true,
                    location: true,
                    badget: true,
                },
            },
        },
        orderBy: {
            saved_at: 'desc',
        },
    });

    // 4) DTOに変換してClient Componentに渡す（セキュリティ強化）
    const savedQuestDTOs = savedQuests.map(savedQuest => ({
        id: savedQuest.id,
        saved_at: savedQuest.saved_at,
        quest: toQuestDTO(savedQuest.quest),
    }));

    return (
        <SavedQuestsClient savedQuests={savedQuestDTOs} />
    );
} 