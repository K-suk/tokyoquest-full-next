"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { StoryReader } from '@/components/stories/StoryReader';
import { Toast, ToastContainer } from '@/components/ui/toast';

export default function StoryLevelPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const [chapter, setChapter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Array<{
        id: string;
        title: string;
        description?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
        duration?: number;
        onClose: (id: string) => void;
    }>>([]);

    const level = parseInt(params.level as string);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch chapter data
    useEffect(() => {
        if (status === 'authenticated' && level) {
            fetchChapter();
        }
    }, [status, level]);

    const fetchChapter = async () => {
        try {
            const response = await fetch(`/api/stories/${level}`);
            if (response.ok) {
                const data = await response.json();
                setChapter(data);
            } else if (response.status === 403) {
                setError('Chapter not unlocked');
                addToast('Chapter Locked', 'This chapter is not yet unlocked. Level up to unlock it!', 'warning');
            } else if (response.status === 404) {
                setError('Chapter not found');
                addToast('Not Found', 'This chapter does not exist.', 'error');
            } else {
                throw new Error('Failed to fetch chapter');
            }
        } catch (error) {
            console.error('Error fetching chapter:', error);
            setError('Failed to load chapter');
            addToast('Error', 'Failed to load chapter', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addToast = (
        title: string,
        description?: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info'
    ) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, description, type, onClose: removeToast }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const handleBack = () => {
        router.push('/stories');
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading chapter...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null; // Will redirect
    }

    if (error || !chapter) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center px-4">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {error || 'Chapter Not Found'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error === 'Chapter not unlocked'
                            ? 'This chapter is not yet unlocked. Complete quests to level up and unlock new chapters!'
                            : 'The chapter you\'re looking for doesn\'t exist or couldn\'t be loaded.'
                        }
                    </p>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Stories
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Stories
                    </button>
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{chapter.title}</h1>
                            <p className="text-sm text-gray-600">Level {chapter.level} of 10</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Story Reader */}
            <StoryReader
                chapter={chapter}
                isOpen={true}
                onClose={handleBack}
                source="direct"
            />

            {/* Toast Container */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
