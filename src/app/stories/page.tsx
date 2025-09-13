"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen, MessageSquare, Filter } from 'lucide-react';
import { StoryCard, StoryChapterMeta } from '@/components/stories/StoryCard';
import { StoryFilters } from '@/components/stories/StoryFilters';
import { StoryTimeline } from '@/components/stories/StoryTimeline';
import { StoryReader } from '@/components/stories/StoryReader';
import { Toast, ToastContainer } from '@/components/ui/toast';

interface StoryData {
    chapters: StoryChapterMeta[];
    unlockedLevels: number[];
    totalChapters: number;
}

export default function StoriesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [storyData, setStoryData] = useState<StoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [toasts, setToasts] = useState<Array<{
        id: string;
        title: string;
        description?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
        duration?: number;
        onClose: (id: string) => void;
        actions?: Array<{
            label: string;
            onClick: () => void;
            variant?: 'primary' | 'secondary';
        }>;
    }>>([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch story data
    useEffect(() => {
        if (status === 'authenticated') {
            fetchStoryData();
        }
    }, [status]);

    const fetchStoryData = async () => {
        try {
            const response = await fetch('/api/stories');
            if (response.ok) {
                const data = await response.json();
                setStoryData(data);
            } else {
                throw new Error('Failed to fetch stories');
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
            addToast('Error', 'Failed to load stories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addToast = (
        title: string,
        description?: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        actions?: Array<{
            label: string;
            onClick: () => void;
            variant?: 'primary' | 'secondary';
        }>
    ) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, description, type, onClose: removeToast, actions }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const handleChapterOpen = async (level: number) => {
        const chapter = storyData?.chapters.find(c => c.level === level);
        if (!chapter || !chapter.unlocked) return;

        // 即座にmodalを表示
        setIsReaderOpen(true);
        setSelectedChapter(null); // ローディング状態にする

        try {
            // Fetch full chapter data
            const response = await fetch(`/api/stories/${level}`);
            if (response.ok) {
                const fullChapter = await response.json();
                setSelectedChapter(fullChapter);
            } else {
                throw new Error('Failed to fetch chapter');
            }
        } catch (error) {
            console.error('Error fetching chapter:', error);
            addToast('Error', 'Failed to load chapter', 'error');
            setIsReaderOpen(false); // エラー時はmodalを閉じる
        }
    };


    const handleReaderClose = () => {
        setIsReaderOpen(false);
        setSelectedChapter(null);
    };

    // Filter chapters based on selected themes
    const filteredChapters = storyData?.chapters.filter(chapter => {
        if (selectedThemes.length === 0) return true;
        return selectedThemes.some(theme => chapter.themeHints.includes(theme));
    }) || [];

    // Get all unique themes
    const allThemes = Array.from(
        new Set(storyData?.chapters.flatMap(c => c.themeHints) || [])
    ).sort();


    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading stories...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Stories</h1>
                    </div>
                    <p className="text-gray-600">
                        Unlock chapters as you level up and explore the mysteries of Tokyo&apos;s future.
                    </p>
                </div>

                {/* Timeline Section */}
                {storyData && (
                    <div className="mb-8">
                        <StoryTimeline
                            chapters={storyData.chapters}
                            onChapterClick={handleChapterOpen}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                    {/* Filters */}
                    <div className="lg:col-span-1">
                        <StoryFilters
                            themes={allThemes}
                            selectedThemes={selectedThemes}
                            onThemeChange={setSelectedThemes}
                        />
                    </div>

                    {/* Chapters Grid */}
                    <div className="lg:col-span-3">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                All Chapters
                            </h2>
                            <p className="text-sm text-gray-600">
                                {filteredChapters.length} of {storyData?.totalChapters || 0} chapters
                                {selectedThemes.length > 0 && ` (filtered by ${selectedThemes.join(', ')})`}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredChapters.map((chapter) => (
                                <StoryCard
                                    key={chapter.id}
                                    chapter={chapter}
                                    onOpen={() => handleChapterOpen(chapter.level)}
                                />
                            ))}
                        </div>

                        {filteredChapters.length === 0 && (
                            <div className="text-center py-12">
                                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No chapters found
                                </h3>
                                <p className="text-gray-600">
                                    Try adjusting your filters or unlock more chapters by leveling up.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Story Reader Modal */}
            {selectedChapter && (
                <StoryReader
                    chapter={selectedChapter}
                    isOpen={isReaderOpen}
                    onClose={handleReaderClose}
                    source="stories_page"
                />
            )}

            {/* Toast Container */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
