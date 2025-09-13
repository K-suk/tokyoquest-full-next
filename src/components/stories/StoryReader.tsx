"use client";

import { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Clock } from 'lucide-react';
import { storyTelemetry } from '@/lib/telemetry';
import { markStoryAsRead } from '@/lib/story-hooks';

export interface StoryChapter {
    id: number;
    level: number;
    title: string;
    bodyEn: string;
    themeHints: string[];
    estReadSec?: number;
}

interface StoryReaderProps {
    chapter: StoryChapter | null;
    isOpen: boolean;
    onClose: () => void;
    source: 'unlock_toast' | 'stories_page' | 'direct';
}

export function StoryReader({ chapter, isOpen, onClose, source }: StoryReaderProps) {
    const [readProgress, setReadProgress] = useState(0);
    const [startTime] = useState(Date.now());

    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Track story opened
    useEffect(() => {
        if (isOpen && chapter) {
            storyTelemetry.opened(chapter.level, source);
        }
    }, [isOpen, chapter, source]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Track scroll progress
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const progress = Math.min((scrollTop + clientHeight) / scrollHeight, 1);
            setReadProgress(progress);
        };

        if (isOpen && contentRef.current) {
            contentRef.current.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (contentRef.current) {
                contentRef.current.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isOpen]);

    // Mark as read when scroll reaches 90%
    useEffect(() => {
        if (readProgress >= 0.9 && chapter) {
            const readMs = Date.now() - startTime;
            markStoryAsRead(chapter.level, readMs, readProgress);
        }
    }, [readProgress, chapter, startTime]);


    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-title"
            aria-describedby="story-content"
        >
            <div
                ref={modalRef}
                className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${!chapter ? 'opacity-90' : ''
                    }`}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <div>
                            {chapter ? (
                                <>
                                    <h2 id="story-title" className="text-xl font-bold text-gray-900">
                                        {chapter.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Level {chapter.level} of 10</span>
                                        {chapter.estReadSec && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>~{chapter.estReadSec}s read</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
                                    <div>
                                        <div className="text-lg font-semibold text-gray-900">Loading Story</div>
                                        <div className="text-sm text-gray-500">Please wait...</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Close story"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div
                    ref={contentRef}
                    id="story-content"
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                    {chapter ? (
                        /* Story Body */
                        <div className="prose prose-lg max-w-none">
                            <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                                {chapter.bodyEn}
                            </div>
                        </div>
                    ) : (
                        /* Loading State */
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Story</h3>
                                <p className="text-gray-600">Please wait while we load the story content...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                        {chapter ? (
                            <div className="text-sm text-gray-500">
                                Progress: {Math.round(readProgress * 100)}%
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                Loading...
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
