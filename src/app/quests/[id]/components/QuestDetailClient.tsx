'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QuestDTO } from '@/lib/dto';
import { dispatchStoryUnlocked } from '@/lib/story-events';
import { LevelUpModal } from '@/components/LevelUpModal';

interface QuestMeta extends Omit<QuestDTO, 'location' | 'badget'> {
    badget?: string;
    location?: string;
    tips?: string;
    officialUrl?: string;
    exampleUrl?: string;
}

interface StatusResponse {
    is_saved: boolean;
    is_completed: boolean;
    completion_date?: string | null;
}

interface Review {
    id: number;
    user: {
        name: string;
    };
    rating: number;
    comment: string;
    created_at: string;
}

interface Props {
    questMeta: QuestMeta;
    questId: number;
}

export default function QuestDetailClient({ questMeta, questId }: Props) {
    // ■ 動的ステータス
    const [statusData, setStatusData] = useState<StatusResponse>({
        is_saved: false,
        is_completed: false,
    });
    const [loadingStatus, setLoadingStatus] = useState(true);

    // ■ レビューデータ
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    // ■ レビュー投稿フォーム用ステート
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);

    // ■ レベルアップ関連
    const [levelUpData, setLevelUpData] = useState<{
        oldLevel: number;
        newLevel: number;
        expGained: number;
        unlockedStories: number[];
    } | null>(null);
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);

    // ■ Complete Quest 用ステート
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [modalAnimation, setModalAnimation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchQuestStatus = useCallback(async () => {
        try {
            setLoadingStatus(true);
            const response = await fetch(`/api/quests/${questId}/status`, {
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                setStatusData(data);
            } else {
                console.error('Failed to fetch quest status');
            }
        } catch (error) {
            console.error('Error fetching quest status:', error);
        } finally {
            setLoadingStatus(false);
        }
    }, [questId]);

    const fetchReviews = useCallback(async () => {
        try {
            setLoadingReviews(true);
            const response = await fetch(`/api/quests/${questId}/reviews`, {
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews);
            } else {
                console.error('Failed to fetch reviews');
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    }, [questId]);

    // コンポーネントマウント時にquest状態とレビューを取得
    useEffect(() => {
        fetchQuestStatus();
        fetchReviews();
    }, [questId, fetchQuestStatus, fetchReviews]);

    /** 平均レーティングを計算 */
    const averageRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / reviews.length;
    }, [reviews]);

    /** 星アイコンを描画 */
    const renderStars = (rating: number) => {
        const filled = Math.round(rating);
        return [1, 2, 3, 4, 5].map((i) => (
            <svg
                key={i}
                className={`w-4 h-4 ${i <= filled ? 'fill-red-400 text-red-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    /** Save ボタン押下時 */
    const handleSave = async () => {
        try {
            // 楽観的更新（即座にUIを更新）
            const newSavedState = !statusData.is_saved;
            setStatusData(prev => ({ ...prev, is_saved: newSavedState }));

            const method = newSavedState ? 'POST' : 'DELETE';
            const response = await fetch(`/api/quests/${questId}/save`, {
                method: method,
                cache: 'no-store',
            });

            if (response.ok) {
                // 成功した場合は状態を維持（楽観的更新が正しかった）
                // alertは削除してよりスムーズな体験に
            } else {
                // エラーが発生した場合は元の状態に戻す
                setStatusData(prev => ({ ...prev, is_saved: statusData.is_saved }));
                const errorData = await response.json();
                alert(`Failed to ${newSavedState ? 'save' : 'unsave'} quest: ${errorData.error}`);
            }
        } catch (error) {
            // エラーが発生した場合は元の状態に戻す
            setStatusData(prev => ({ ...prev, is_saved: statusData.is_saved }));
            console.error('Error saving/unsaving quest:', error);
            alert('Failed to save/unsave quest. Please try again.');
        }
    };

    /** Complete Quest ボタン押下時 */
    const handleCompleteQuest = async () => {
        if (!selectedImage) return;

        setIsUploading(true);
        try {
            const response = await fetch(`/api/quests/${questId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData: selectedImage
                }),
            });

            if (response.ok) {
                const result = await response.json();

                // レベルアップデータがある場合はモーダルを表示
                if (result.levelUp) {
                    setLevelUpData(result.levelUp);
                    setShowLevelUpModal(true);

                    // ストーリー解放イベントを発火
                    if (result.levelUp.unlockedStories.length > 0) {
                        dispatchStoryUnlocked();
                    }
                } else {
                    alert('Quest completed successfully! You earned 100 experience points!');
                }

                // quest状態を再取得
                await fetchQuestStatus();
                setShowCompleteModal(false);
                setSelectedImage(null);
            } else {
                const errorData = await response.json();
                alert(`Failed to complete quest: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error completing quest:', error);
            alert('Failed to complete quest. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    /** 画像選択時に Base64 をセット */
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setSelectedImage(result);
            };
            reader.readAsDataURL(file);
        }
    };

    /** カメラで撮影 */
    const handleCaptureImage = () => {
        fileInputRef.current?.click();
    };

    /** レビュー投稿 */
    const submitReview = async () => {
        if (!newComment.trim() || newRating === 0) {
            alert('Please provide both a rating and comment.');
            return;
        }

        setSubmittingReview(true);
        try {
            const response = await fetch(`/api/quests/${questId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating: newRating,
                    comment: newComment.trim(),
                }),
            });

            if (response.ok) {
                // レビュー投稿成功
                setNewComment('');
                setNewRating(0);
                // レビュー一覧を再取得
                await fetchReviews();
                alert('Review submitted successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to submit review: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    /** モーダルを開く */
    const openModal = () => {
        setShowCompleteModal(true);
        setTimeout(() => setModalAnimation(true), 10);
    };

    /** モーダルを閉じる */
    const closeModal = () => {
        setModalAnimation(false);
        setTimeout(() => {
            setShowCompleteModal(false);
            setSelectedImage(null);
        }, 300);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* =========================================== */}
            {/* 1. レーティングバー & Save ボタン */}
            <div className="bg-black text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => window.history.back()}
                    >
                        ←
                    </button>
                    <div className="flex items-center gap-1">
                        {renderStars(averageRating)}
                        <span className="ml-1 text-sm">{averageRating.toFixed(1)}</span>
                        <span className="ml-2 text-sm underline">
                            {reviews?.length ?? 0} Review
                            {reviews && reviews.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <div>
                    <button
                        onClick={handleSave}
                        disabled={loadingStatus}
                        className={`px-3 py-1 text-sm bg-black border border-white text-white rounded
                        ${loadingStatus
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-800'
                            }`}
                    >
                        {loadingStatus ? 'Loading...' : (statusData.is_saved ? 'Unsave' : 'Save')}
                    </button>
                </div>
            </div>

            {/* =========================================== */}
            {/* 2. メインコンテンツ（静的メタデータ部分） */}
            <div className="px-4 md:px-8 lg:px-12 mt-6">
                <div className="mb-4">
                    <Image
                        src="/images/no_image.png"
                        alt={`${questMeta.title} - Quest Image`}
                        width={400}
                        height={200}
                        className="w-full h-48 md:h-64 object-cover rounded-lg"
                        quality={60}
                        priority={false}
                    />
                </div>
                <h1 className="text-xl font-bold mb-3">{questMeta.title}</h1>
                <div className="mb-4 space-y-2">
                    <div className="text-sm">
                        <span className="font-medium">Budget:</span> {questMeta.badget || "Not specified"}
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">Map:</span>{' '}
                        <Link
                            href={questMeta.location || '#'}
                            className="text-blue-500 underline text-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {questMeta.location || "No location available"}
                        </Link>
                    </div>
                </div>
            </div>

            {/* =========================================== */}
            {/* 3. Complete Quest ボタン */}
            <div className="px-4 md:px-8 lg:px-12">
                <button
                    onClick={openModal}
                    disabled={statusData.is_completed || loadingStatus}
                    className={`w-full bg-red-500 hover:bg-red-600 text-white mb-6 py-3 rounded font-medium
                    ${statusData.is_completed || loadingStatus ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loadingStatus ? 'Loading...' : (statusData.is_completed ? 'Completed' : 'Complete Quest')}
                </button>
            </div>

            {/* Complete Quest モーダル */}
            {showCompleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className={`absolute inset-0 bg-black bg-opacity-20 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${modalAnimation ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeModal}
                    />
                    <div className={`relative bg-white rounded-lg max-w-md w-full max-h-full overflow-y-auto shadow-2xl transform transition-all duration-300 ease-out ${modalAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                        <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Complete Quest</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl hover:opacity-80 transition-opacity duration-200"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 pt-4 space-y-4">
                            <p className="text-gray-600 mb-4">
                                Take a photo or upload an image to complete this quest!
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* 撮影オプション */}
                                <div className="space-y-2">
                                    <button
                                        onClick={handleCaptureImage}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
                                    >
                                        📷 Take Photo
                                    </button>
                                </div>

                                {/* アップロードオプション */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => {
                                                        const result = e.target?.result as string;
                                                        setSelectedImage(result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            };
                                            input.click();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
                                    >
                                        📤 Upload Image
                                    </button>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {selectedImage && (
                                <div className="space-y-4">
                                    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
                                        {selectedImage.startsWith('data:video/') ? (
                                            <video
                                                src={selectedImage}
                                                controls
                                                className="w-full h-auto"
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img
                                                src={selectedImage}
                                                alt="Quest completion proof"
                                                className="w-full h-auto object-contain"
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCompleteQuest}
                                        disabled={!selectedImage || isUploading}
                                        className={`w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium transition-colors duration-200
                                        ${(!selectedImage || isUploading)
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                            }`}
                                    >
                                        {isUploading ? 'Completing...' : 'Complete Quest'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================== */}
            {/* 4. Quest Detail（静的部分） */}
            <section className="mb-6 px-4 md:px-8 lg:px-12">
                <h2 className="text-lg font-bold mb-3">Quest Detail</h2>
                <p className="text-sm text-gray-700">{questMeta.description}</p>
            </section>

            {/* =========================================== */}
            {/* 5. Only locals knows（静的部分） */}
            <section className="mb-6 px-4 md:px-8 lg:px-12">
                <h2 className="text-lg font-bold mb-3">Only locals knows</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {questMeta.tips || "No tips available for this quest."}
                </p>
            </section>

            {/* =========================================== */}
            {/* 6. Official Web site（静的部分） */}
            <section className="mb-6 px-4 md:px-8 lg:px-12">
                <h3 className="font-bold mb-2">Official Web site</h3>
                <Link
                    href={questMeta.officialUrl || '#'}
                    className="text-blue-500 underline text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {questMeta.officialUrl || 'No Official Website exists...'}
                </Link>
            </section>

            {/* =========================================== */}
            {/* 7. Review Section（動的部分） */}
            <section className="mb-6 px-4 md:px-8 lg:px-12">
                <h2 className="text-lg font-bold mb-4">Review</h2>
                {loadingReviews ? (
                    <div className="text-gray-500">Loading reviews...</div>
                ) : reviews && reviews.length > 0 ? (
                    reviews.map((r) => (
                        <div key={r.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: r.rating }).map((_, i) => (
                                        <svg
                                            key={i}
                                            className="w-4 h-4 fill-red-400 text-red-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                    {Array.from({ length: 5 - r.rating }).map((_, i) => (
                                        <svg
                                            key={`empty-${i}`}
                                            className="w-4 h-4 text-gray-300"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h4 className="font-bold mb-1">{r.user.name}</h4>
                            <p className="text-sm text-gray-700">{r.comment}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500">Be the first person to explore this quest!</div>
                )}
            </section>

            {/* =========================================== */}
            {/* 8. Leave Review（動的部分） */}
            <section className="px-4 md:px-8 lg:px-12 pb-8">
                <h2 className="text-lg font-bold mb-4">Leave Review</h2>
                <textarea
                    placeholder="Tell us about your experience!"
                    className="mb-4 min-h-[120px] w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={1000}
                ></textarea>

                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <svg
                            key={i}
                            onClick={() => setNewRating(i)}
                            className={`w-6 h-6 cursor-pointer transition-colors duration-200 ${i <= newRating
                                ? 'text-red-400 fill-red-400'
                                : 'text-gray-300 fill-gray-300 hover:text-red-300 hover:fill-red-300'
                                }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="text-right">
                    <button
                        onClick={submitReview}
                        disabled={submittingReview || newRating === 0 || !newComment.trim()}
                        className={`bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded font-medium${submittingReview || newRating === 0 || !newComment.trim()
                            ? ' opacity-50 cursor-not-allowed'
                            : ''
                            }`}
                    >
                        {submittingReview ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </section>

            {/* Level Up Modal */}
            {levelUpData && (
                <LevelUpModal
                    isOpen={showLevelUpModal}
                    onClose={() => {
                        setShowLevelUpModal(false);
                        setLevelUpData(null);
                    }}
                    onReadStory={(level) => {
                        setShowLevelUpModal(false);
                        setLevelUpData(null);
                        window.open(`/stories/${level}`, '_blank');
                    }}
                    onViewStories={() => {
                        setShowLevelUpModal(false);
                        setLevelUpData(null);
                        window.open('/stories', '_blank');
                    }}
                    levelUpData={levelUpData}
                />
            )}
        </div>
    );
} 