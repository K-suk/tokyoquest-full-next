"use client";

import { useState } from "react";
import QuestCard from "./QuestCard";
import { Quest } from "./QuestCard";

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface PaginatedQuestsProps {
    initialQuests: Quest[];
    initialPagination: PaginationInfo;
}

export default function PaginatedQuests({
    initialQuests,
    initialPagination
}: PaginatedQuestsProps) {
    const [quests, setQuests] = useState<Quest[]>(initialQuests);
    const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchQuests = async (page: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
            });

            const response = await fetch(`/api/quests/paginated?${params}`);
            if (response.ok) {
                const data = await response.json();
                setQuests(data.quests);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching quests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchQuests(page);
    };

    return (
        <div className="space-y-6">
            {/* クエスト一覧 */}
            <div className="px-4">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse bg-gray-200 rounded-lg h-[200px]"
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quests.map((quest) => (
                                <QuestCard key={quest.id} quest={quest} />
                            ))}
                        </div>

                        {/* ページネーション */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!pagination.hasPrevPage || loading}
                                    className={`px-3 py-2 rounded-lg border ${pagination.hasPrevPage && !loading
                                        ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        }`}
                                >
                                    Previous
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={loading}
                                                className={`px-3 py-2 rounded-lg border ${currentPage === pageNum
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!pagination.hasNextPage || loading}
                                    className={`px-3 py-2 rounded-lg border ${pagination.hasNextPage && !loading
                                        ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {/* 結果数表示 */}
                        <div className="text-center text-gray-600 mt-4">
                            Showing {quests.length} of {pagination.totalCount} quests
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
