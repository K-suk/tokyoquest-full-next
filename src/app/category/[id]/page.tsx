import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import CategoryClient from "./components/CategoryClient";

// キャッシュを無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface CategoryPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    // 1) 認証チェック（セッション情報は露出させない）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    const { id } = await params;

    console.log(`🔍 Category page accessed with id: ${id}`);

    // 2) タグとクエストデータを取得（nameまたはidで検索）
    let tag;

    // 数値の場合はIDで検索
    const tagId = parseInt(id, 10);
    if (!isNaN(tagId)) {
        console.log(`🔢 Searching by ID: ${tagId}`);
        tag = await prisma.tag.findUnique({
            where: { id: tagId },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
    } else {
        // 文字列の場合はnameで検索
        console.log(`📝 Searching by name: ${id}`);
        tag = await prisma.tag.findUnique({
            where: { name: id },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
    }

    console.log(`🏷️ Tag found:`, tag);

    if (!tag) {
        notFound();
    }

    // 3) クエストデータを取得
    const quests = await prisma.quest.findMany({
        where: {
            tags: {
                some: {
                    id: tag.id,
                },
            },
        },
        select: {
            id: true,
            title: true,
            description: true,
            imgUrl: true,
        },
        orderBy: {
            id: 'asc',
        },
    });

    // 4) ユーザーの保存済みクエストIDを取得
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        redirect("/login");
    }

    const savedQuests = await prisma.savedQuest.findMany({
        where: { user_id: user.id },
        select: { quest_id: true },
    });

    const savedQuestIds = new Set(savedQuests.map(sq => sq.quest_id));

    return (
        <CategoryClient
            tag={tag}
            quests={quests}
            savedQuestIds={Array.from(savedQuestIds)}
        />
    );
}
