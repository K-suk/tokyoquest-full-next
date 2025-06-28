'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface SavedQuest {
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

export default function SavedQuestsPage() {
    const [savedQuests, setSavedQuests] = useState<SavedQuest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // 保存されたquest一覧を取得
    const fetchSavedQuests = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/saved-quests');

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please log in to view saved quests');
                } else {
                    setError('Failed to fetch saved quests');
                }
                return;
            }

            const data = await response.json();
            setSavedQuests(data.savedQuests);
        } catch (error) {
            console.error('Error fetching saved quests:', error);
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedQuests();
    }, []);

    // questを保存解除
    const unsaveQuest = async (questId: number) => {
        try {
            const response = await fetch(`/api/quests/${questId}/save`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // 保存されたquest一覧から削除
                setSavedQuests(prev => prev.filter(savedQuest => savedQuest.quest.id !== questId));
            } else {
                const errorData = await response.json();
                alert(`Failed to unsave quest: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error unsaving quest:', error);
            alert('Failed to unsave quest. Please try again.');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h2 className="text-red-800 font-semibold">Error</h2>
                        <p className="text-red-600">{error}</p>
                        {error.includes('log in') && (
                            <Link href="/login" className="text-red-600 underline mt-2 inline-block">
                                Go to Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Saved Quests
                        </h1>
                        <button
                            onClick={() => router.back()}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ローディング */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                )}

                {/* 保存されたquest一覧 */}
                {!loading && (
                    <div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savedQuests.map((savedQuest) => (
                                    <div key={savedQuest.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="relative h-48">
                                            <Image
                                                src={savedQuest.quest.imgUrl || "/images/tokyonight.webp"}
                                                alt={savedQuest.quest.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={() => unsaveQuest(savedQuest.quest.id)}
                                                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                                    title="Unsave quest"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                {savedQuest.quest.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {savedQuest.quest.description}
                                            </p>
                                            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                                                <span>📍 {savedQuest.quest.location}</span>
                                                {savedQuest.quest.badget && (
                                                    <span>💰 {savedQuest.quest.badget}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">
                                                    Saved on {new Date(savedQuest.saved_at).toLocaleDateString()}
                                                </span>
                                                <Link
                                                    href={`/quests/${savedQuest.quest.id}`}
                                                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                                                >
                                                    View Quest
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 