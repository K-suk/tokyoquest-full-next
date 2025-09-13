"use client";

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export interface StoryFiltersProps {
    themes: string[];
    selectedThemes: string[];
    onThemeChange: (themes: string[]) => void;
}

export function StoryFilters({
    themes,
    selectedThemes,
    onThemeChange,
}: StoryFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleThemeToggle = (theme: string) => {
        if (selectedThemes.includes(theme)) {
            onThemeChange(selectedThemes.filter(t => t !== theme));
        } else {
            onThemeChange([...selectedThemes, theme]);
        }
    };

    const clearFilters = () => {
        onThemeChange([]);
    };

    const hasActiveFilters = selectedThemes.length > 0;

    return (
        <div className="space-y-4">
            {/* Filter Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {hasActiveFilters && (
                    <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                        {selectedThemes.length}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {/* Themes */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Themes</h3>
                        <div className="flex flex-wrap gap-2">
                            {themes.map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => handleThemeToggle(theme)}
                                    className={`
                    px-3 py-1 text-sm rounded-full transition-colors duration-200
                    ${selectedThemes.includes(theme)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }
                  `}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <div className="pt-2 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                            >
                                <X className="w-4 h-4" />
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
