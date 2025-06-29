import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toUserDTO, toQuestDTO } from "@/lib/dto";
import ProfileHeader from "./components/ProfileHeader";
import CompletedQuestsSection from "./components/CompletedQuestsSection";

// セキュリティヘッダー
export const headers = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

export default async function ProfilePage() {
    // サーバーサイドでセッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    // 並列でデータを取得
    const [user, completedQuests, savedQuests] = await Promise.all([
        // ユーザー情報を取得
        prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                name: true,
                level: true,
                exp: true,
                email: true,
            },
        }),
        // 完了したクエストを取得
        prisma.questCompletion.findMany({
            where: {
                user: {
                    email: session.user.email,
                },
            },
            include: {
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
                completion_date: "desc",
            },
        }),
        // 保存したクエストを取得
        prisma.savedQuest.findMany({
            where: {
                user: {
                    email: session.user.email,
                },
            },
            select: {
                quest_id: true,
            },
        }),
    ]);

    if (!user) {
        redirect("/login");
    }

    // DTOに変換してClient Componentに渡す
    const userDTO = toUserDTO(user);
    const questDTOs = completedQuests.map(completion => toQuestDTO(completion.quest));
    const savedQuestIds = new Set(savedQuests.map(sq => sq.quest_id));

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full bg-white">
                {/* プロフィールヘッダー - セッション情報なし */}
                <ProfileHeader user={userDTO} />

                {/* 完了クエストセクション */}
                <CompletedQuestsSection
                    completedQuests={questDTOs}
                    savedQuestIds={savedQuestIds}
                />
            </div>
        </div>
    );
}
