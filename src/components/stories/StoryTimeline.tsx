"use client";

import { BookOpen, Lock } from 'lucide-react';

export interface StoryTimelineProps {
    chapters: Array<{
        level: number;
        title: string;
        unlocked: boolean;
        lastReadAt?: string;
    }>;
    onChapterClick: (level: number) => void;
}

export function StoryTimeline({ chapters, onChapterClick }: StoryTimelineProps) {
    const sortedChapters = [...chapters].sort((a, b) => a.level - b.level);
    const unlockedCount = chapters.filter(c => c.unlocked).length;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your Journey</h2>
                <p className="text-sm text-gray-600">
                    {unlockedCount} of {chapters.length} chapters unlocked
                </p>
            </div>

            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Timeline Items */}
                <div className="space-y-4">
                    {sortedChapters.map((chapter, index) => {
                        const saturation = Math.min(20 + (chapter.level * 8), 100); // 20% to 100% saturation
                        const isLast = index === sortedChapters.length - 1;

                        return (
                            <div key={chapter.level} className="relative flex items-start gap-4">
                                {/* Timeline Dot */}
                                <div className="relative z-10">
                                    <button
                                        onClick={() => chapter.unlocked && onChapterClick(chapter.level)}
                                        disabled={!chapter.unlocked}
                                        className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-200 border-2
                      ${chapter.unlocked
                                                ? 'bg-white border-blue-500 hover:border-blue-600 hover:shadow-md cursor-pointer'
                                                : 'bg-gray-100 border-gray-300 cursor-not-allowed'
                                            }
                    `}
                                        style={{
                                            filter: chapter.unlocked
                                                ? `saturate(${saturation}%)`
                                                : 'saturate(0%)',
                                        }}
                                    >
                                        {chapter.unlocked ? (
                                            <BookOpen className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-600">
                                            Level {chapter.level}
                                        </span>
                                        {chapter.lastReadAt && (
                                            <span className="text-xs text-gray-500">
                                                • Read {new Date(chapter.lastReadAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {chapter.title}
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((unlockedCount / chapters.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(unlockedCount / chapters.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
