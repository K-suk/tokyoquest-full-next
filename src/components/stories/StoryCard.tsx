"use client";

import { Lock, BookOpen, Clock, CheckCircle, MessageSquare } from 'lucide-react';

export interface StoryChapterMeta {
    id: number;
    level: number;
    title: string;
    themeHints: string[];
    estReadSec?: number;
    riddleEn?: string;
    unlocked: boolean;
    lastReadAt?: string;
    hasAnswer: boolean;
    hasRiddle: boolean;
}

interface StoryCardProps {
    chapter: StoryChapterMeta;
    onOpen: () => void;
}

export function StoryCard({ chapter, onOpen }: StoryCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getPreviewText = () => {
        // This would normally come from the chapter data
        // For now, we'll use a placeholder
        const previews = {
            1: "Do you hear me? This voice comes from a time far beyond your own...",
            2: "In the future Tokyo I inhabit, the streets are unnervingly quiet...",
            3: "In the Tokyo of the future, no one makes wishes anymore...",
            4: "I want you to picture the city we live in...",
            5: "There is something missing in our world...",
            6: "There is one absence that hurts more than all the rest...",
            7: "I must speak plainly now. I am afraid...",
            8: "I want to tell you what hurts most...",
            9: "I cannot hide it any longer. You deserve the truth...",
            10: "It has happened. I can see it with my own eyes...",
        };
        return previews[chapter.level as keyof typeof previews] || "A story awaits...";
    };

    return (
        <div
            className={`
        relative rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${chapter.unlocked
                    ? 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }
      `}
            onClick={chapter.unlocked ? onOpen : undefined}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {chapter.unlocked ? (
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            ) : (
                                <Lock className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-600">
                                Level {chapter.level}
                            </span>
                            {chapter.hasAnswer && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {chapter.title}
                        </h3>
                    </div>
                    {chapter.unlocked && chapter.lastReadAt && (
                        <div className="text-xs text-gray-500">
                            Read {formatDate(chapter.lastReadAt)}
                        </div>
                    )}
                </div>

                {/* Preview */}
                <p className="text-sm text-gray-600 line-clamp-2">
                    {getPreviewText()}
                </p>
            </div>

            {/* Footer */}
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Theme Tags */}
                        <div className="flex flex-wrap gap-1">
                            {chapter.themeHints.slice(0, 2).map((theme) => (
                                <span
                                    key={theme}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                    {theme}
                                </span>
                            ))}
                            {chapter.themeHints.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    +{chapter.themeHints.length - 2}
                                </span>
                            )}
                        </div>

                        {/* Riddle Indicator */}
                        {chapter.hasRiddle && (
                            <div className="flex items-center gap-1 text-xs text-purple-600">
                                <MessageSquare className="w-3 h-3" />
                                <span>Riddle</span>
                            </div>
                        )}
                    </div>

                    {/* Read Time */}
                    {chapter.estReadSec && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{chapter.estReadSec}s</span>
                        </div>
                    )}
                </div>

                {/* Status Badge */}
                {!chapter.unlocked && (
                    <div className="mt-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
