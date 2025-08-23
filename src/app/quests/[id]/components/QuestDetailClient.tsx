'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QuestDTO } from '@/lib/dto';
import ARFilterCapture from '@/components/ARFilterCapture';

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

    // ■ Complete Quest 用ステート
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [modalAnimation, setModalAnimation] = useState(false);
    const [showARFilter, setShowARFilter] = useState(false);
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
                alert('Quest completed successfully! You earned 100 experience points!');
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
            setShowARFilter(false);
        }, 300);
    };

    /** ARフィルター撮影を開始 */
    const startARFilterCapture = () => {
        setShowARFilter(true);
    };

    /** ARフィルター撮影をキャンセル */
    const cancelARFilterCapture = () => {
        setShowARFilter(false);
    };

    /** ARフィルター撮影完了時のコールバック */
    const handleARFilterCapture = (imageData: string) => {
        setSelectedImage(imageData);
        setShowARFilter(false);
    };

    /** 画像をダウンロードするヘルパー関数 */
    const downloadImage = (imageData: string, fileName: string) => {
        try {
            // 方法1: 直接ダウンロード
            const link = document.createElement('a');
            link.href = imageData;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error('Direct download failed:', error);

            try {
                // 方法2: Blobを使用したダウンロード
                const base64Data = imageData.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // メモリリークを防ぐためにURLを解放
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                return true;
            } catch (blobError) {
                console.error('Blob download failed:', blobError);
                return false;
            }
        }
    };

    /** Instagramアプリを開く関数 */
    const openInstagramApp = () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) {
            window.open('https://www.instagram.com/', '_blank');
            return;
        }

        // 複数のInstagramディープリンクを試行
        const instagramUrls = [
            'instagram://library?AssetPickerSourceType=1', // ライブラリを開く
            'instagram://camera', // カメラを開く
            'instagram://', // アプリを開く
        ];

        let currentIndex = 0;

        const tryNextUrl = () => {
            if (currentIndex >= instagramUrls.length) {
                // すべて失敗した場合はWeb版を開く
                window.open('https://www.instagram.com/', '_blank');
                alert('📸 Photo downloaded! Please upload it to Instagram manually.');
                return;
            }

            const url = instagramUrls[currentIndex];
            currentIndex++;

            try {
                // iframeを使用してアプリを開く
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);

                setTimeout(() => {
                    document.body.removeChild(iframe);
                    // 次のURLを試行
                    setTimeout(tryNextUrl, 1000);
                }, 500);
            } catch (error) {
                console.error('Failed to open Instagram app:', error);
                tryNextUrl();
            }
        };

        tryNextUrl();
    };

    /** Instagramでシェア */
    const shareToInstagram = async (imageData: string | null) => {
        if (!imageData) {
            alert('No image data available for sharing.');
            return;
        }

        try {
            // 画像形式を判定
            const isJPEG = imageData.startsWith('data:image/jpeg');
            const isPNG = imageData.startsWith('data:image/png');

            if (!isJPEG && !isPNG) {
                throw new Error('Unsupported image format');
            }

            const imageType = isJPEG ? 'image/jpeg' : 'image/png';
            const fileExtension = isJPEG ? 'jpg' : 'png';

            // Base64画像データをBlobに変換
            const base64Data = imageData.split(',')[1]; // data:image/jpeg;base64, の部分を除去
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: imageType });

            // ファイル名を生成
            const fileName = `tokyoquest_${questMeta.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExtension}`;

            // Fileオブジェクトを作成
            const file = new File([blob], fileName, { type: imageType });

            // ハッシュタグを生成
            const hashtags = `#TokyoQuest #${questMeta.title.replace(/[^a-zA-Z0-9]/g, '')} #Tokyo #Quest #Adventure`;
            const shareText = `Just completed this amazing quest in Tokyo! 🗼✨\n\n${hashtags}`;

            // Web Share APIを使用（モバイルの場合）
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Completed TokyoQuest: ${questMeta.title}`,
                    text: shareText,
                    files: [file]
                });
            } else {
                // モバイルデバイスの場合、Instagramアプリを直接開く
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                if (isMobile) {
                    // 画像をダウンロード
                    const downloadSuccess = downloadImage(imageData, fileName);

                    if (downloadSuccess) {
                        // Instagramアプリを開く
                        setTimeout(() => {
                            openInstagramApp();
                        }, 500);
                    } else {
                        throw new Error('Download failed');
                    }
                } else {
                    // デスクトップの場合
                    const downloadSuccess = downloadImage(imageData, fileName);

                    if (downloadSuccess) {
                        // Instagram Web版を開く
                        setTimeout(() => {
                            window.open('https://www.instagram.com/', '_blank');
                            alert('📸 Photo downloaded! Please upload it to Instagram manually.\n\nTip: Use the hashtags in the downloaded filename!');
                        }, 1000);
                    } else {
                        throw new Error('Download failed');
                    }
                }
            }
        } catch (error) {
            console.error('Share error:', error);

            // フォールバック: 直接ダウンロード
            try {
                // 画像形式を判定してファイル名を決定
                const isJPEG = imageData.startsWith('data:image/jpeg');
                const fileExtension = isJPEG ? 'jpg' : 'png';
                const fileName = `tokyoquest_${questMeta.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExtension}`;

                const downloadSuccess = downloadImage(imageData, fileName);

                if (downloadSuccess) {
                    // Instagramアプリを開く
                    setTimeout(() => {
                        openInstagramApp();
                    }, 500);
                } else {
                    alert('Failed to download photo. Please try taking the photo again or check your browser permissions.');
                }
            } catch (fallbackError) {
                console.error('Fallback download error:', fallbackError);
                alert('Failed to share. Please try taking the photo again or check your browser permissions.');
            }
        }
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
                    {questMeta.imgUrl ? (
                        <Image
                            src={questMeta.imgUrl}
                            alt={`${questMeta.title} - Quest Image`}
                            width={400}
                            height={200}
                            className="w-full h-48 md:h-64 object-cover rounded-lg"
                            quality={75}
                            priority={true}
                        />
                    ) : (
                        <Image
                            src={"/images/tokyonight.webp"}
                            alt="Quest Hero"
                            width={400}
                            height={200}
                            className="w-full h-48 md:h-64 object-cover rounded-lg"
                        />
                    )}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className={`absolute inset-0 bg-black bg-opacity-20 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${modalAnimation ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeModal}
                    />
                    <div className={`relative bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 ease-out ${modalAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Complete Quest</h2>
                            <button
                                onClick={closeModal}
                                className="text-2xl hover:opacity-80 transition-opacity duration-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-600 mb-4">
                                Take a photo or upload an image to complete this quest!
                            </p>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {/* 撮影オプション */}
                                <div className="space-y-2">
                                    <button
                                        onClick={handleCaptureImage}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200 text-sm"
                                    >
                                        📷 Take Photo
                                    </button>
                                </div>

                                {/* ARフィルター撮影オプション */}
                                <div className="space-y-2">
                                    <button
                                        onClick={startARFilterCapture}
                                        className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md transition-colors duration-200 text-sm"
                                    >
                                        🕶️ AR Filter
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
                                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200 text-sm"
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
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
                                        <Image
                                            src={selectedImage}
                                            alt="Quest completion proof"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCompleteQuest}
                                            disabled={!selectedImage || isUploading}
                                            className={`flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium transition-colors duration-200
                                            ${(!selectedImage || isUploading)
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                                }`}
                                        >
                                            {isUploading ? 'Completing...' : 'Complete Quest'}
                                        </button>
                                        <button
                                            onClick={() => shareToInstagram(selectedImage)}
                                            disabled={!selectedImage}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                                            title="Share to Instagram"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                            Share
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ARフィルター撮影モーダル */}
            {showARFilter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
                    <div className="relative bg-white p-6 rounded-lg max-w-4xl w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">🕶️ TokyoQuest AR Filter</h2>
                            <button
                                onClick={cancelARFilterCapture}
                                className="text-2xl hover:opacity-80 transition-opacity duration-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-center mb-4">
                            <p className="text-gray-600">Use our exclusive TokyoQuest sunglasses filter!</p>
                        </div>
                        <ARFilterCapture onCapture={handleARFilterCapture} onCancel={cancelARFilterCapture} />
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
        </div>
    );
} 