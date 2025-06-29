'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestCard, { Quest } from '@/components/QuestCard';

interface SavedQuestDTO {
    id: number;
    saved_at: string;
    quest: {
        id: number;
        title: string;
        description: string;
        imgUrl: string | null;
        location: string;
        badget: string | null;
    };
}

interface SavedQuestsClientProps {
    savedQuests: SavedQuestDTO[];
}

export default function SavedQuestsClient({ savedQuests }: SavedQuestsClientProps) {
    const router = useRouter();

    // QuestCard用のデータ形式に変換
    const questCards: Quest[] = savedQuests.map(savedQuest => ({
        id: savedQuest.quest.id,
        title: savedQuest.quest.title,
        description: savedQuest.quest.description,
        imgUrl: savedQuest.quest.imgUrl || "",
        is_saved: true, // 保存済みクエストなので常にtrue
    }));

    return (
        <main className="pb-6">
            {/* ヘッダー */}
            <section className="px-4 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Saved Quests</h2>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            </section>

            {/* Saved Quests Grid */}
            <section className="px-4">
                {savedQuests.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            No saved quests yet
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Save quests you&apos;re interested in to see them here
                        </p>
                        <Link
                            href="/"
                            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Explore Quests
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {questCards.map((quest) => (
                            <QuestCard key={quest.id} quest={quest} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
} 