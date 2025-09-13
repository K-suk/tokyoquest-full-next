"use client";

import { useState, useEffect } from 'react';
import { X, Star, BookOpen, Trophy } from 'lucide-react';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReadStory: (level: number) => void;
    onViewStories: () => void;
    levelUpData: {
        oldLevel: number;
        newLevel: number;
        expGained: number;
        unlockedStories: number[];
    } | null;
}

export function LevelUpModal({
    isOpen,
    onClose,
    onReadStory,
    onViewStories,
    levelUpData,
}: LevelUpModalProps) {
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowAnimation(true);
        }
    }, [isOpen]);

    const handleClose = () => {
        setShowAnimation(false);
        setTimeout(onClose, 300);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen || !levelUpData) return null;

    const { oldLevel, newLevel, expGained, unlockedStories } = levelUpData;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
        >
            <div
                className={`
          bg-white rounded-lg shadow-xl max-w-md w-full p-6
          transition-all duration-300 ease-out
          ${showAnimation
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 translate-y-4'
                    }
        `}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h2 id="level-up-title" className="text-2xl font-bold text-gray-900 mb-2">
                        Level Up!
                    </h2>
                    <p className="text-lg text-gray-600">
                        Level {oldLevel} → Level {newLevel}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-blue-900">Experience Gained</span>
                        </div>
                        <p className="text-blue-800">+{expGained} EXP</p>
                    </div>

                    {unlockedStories.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                <span className="font-semibold text-purple-900">New Stories Unlocked</span>
                            </div>
                            <p className="text-purple-800 mb-2">
                                {unlockedStories.length} new chapter{unlockedStories.length > 1 ? 's' : ''} available!
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {unlockedStories.map((level) => (
                                    <span
                                        key={level}
                                        className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full"
                                    >
                                        Level {level}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    {unlockedStories.length > 0 && (
                        <button
                            onClick={() => onReadStory(unlockedStories[0])}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                        >
                            Read New Story
                        </button>
                    )}
                    <button
                        onClick={onViewStories}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                    >
                        View All Stories
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors duration-200"
                    >
                        Continue Playing
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
