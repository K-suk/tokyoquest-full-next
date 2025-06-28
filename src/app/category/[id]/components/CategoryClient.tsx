'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuestCard from "@/components/QuestCard";

interface Quest {
    id: number;
    title: string;
    description: string;
    imgUrl: string | null;
}

interface Tag {
    id: number;
    name: string;
    description: string | null;
}

interface CategoryClientProps {
    tag: Tag;
    quests: Quest[];
    savedQuestIds: number[];
}

export default function CategoryClient({ tag, quests, savedQuestIds }: CategoryClientProps) {
    const savedQuestIdsSet = new Set(savedQuestIds);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <span className="text-2xl font-bold text-gray-900">
                                {tag.name}
                            </span>
                            <span className="text-gray-600 ml-3">
                                {quests.length} quest{quests.length !== 1 ? 's' : ''} found
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* クエスト一覧 */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <p className="text-gray-600 mb-6">
                    {tag.description}
                </p>
                {quests.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quests.map((quest) => (
                            <Link
                                key={quest.id}
                                href={`/quests/${quest.id}`}
                                className="block"
                            >
                                <QuestCard quest={{
                                    id: quest.id,
                                    title: quest.title,
                                    description: quest.description,
                                    imgUrl: quest.imgUrl ?? "",
                                    is_saved: savedQuestIdsSet.has(quest.id)
                                }} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🔍</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            No quests found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            No quests available for the &quot;{tag.name}&quot; category yet.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Browse All Quests
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
} 