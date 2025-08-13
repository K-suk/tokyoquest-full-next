"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export type Quest = {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    is_saved: boolean;
};

interface QuestCardProps {
    quest: Quest;
}

export default function QuestCard({ quest }: QuestCardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // サーバーから渡された is_saved を初期値にする
    const [saved, setSaved] = useState(quest.is_saved);
    const [loading, setLoading] = useState(false);

    // quest.is_savedが変更された場合に状態を更新
    useEffect(() => {
        setSaved(quest.is_saved);
    }, [quest.is_saved]);

    // ページフォーカス時にsave状態を再取得
    useEffect(() => {
        const handleFocus = async () => {
            try {
                const response = await fetch(`/api/quests/${quest.id}/status`, {
                    cache: 'no-store',
                });
                if (response.ok) {
                    const data = await response.json();
                    setSaved(data.is_saved);
                }
            } catch (error) {
                console.error('Error fetching quest status:', error);
            }
        };

        // ページがフォーカスされた時に実行
        window.addEventListener('focus', handleFocus);

        // コンポーネントマウント時にも実行
        handleFocus();

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [quest.id]);

    const handleSaveToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading) {
            // 現在リクエスト中なら何もしない
            return;
        }

        // 楽観的更新（即座にUIを更新）
        const newSavedState = !saved;
        setSaved(newSavedState);
        setLoading(true);

        try {
            const method = newSavedState ? "POST" : "DELETE";
            const res = await fetch(`/api/quests/${quest.id}/save`, {
                method: method,
                cache: 'no-store', // キャッシュを無効化
            });

            if (res.status === 401) {
                // 未認証なら /login へリダイレクト
                window.location.href = "/login";
                return;
            }

            if (!res.ok) {
                // エラーが発生した場合は元の状態に戻す
                setSaved(saved);
                const errText = await res.text().catch(() => "Save/unsave failed");
                throw new Error(errText);
            }

            // 成功した場合は状態を維持（楽観的更新が正しかった）
        } catch (err) {
            console.error(err);
            // エラーが発生した場合は元の状態に戻す
            setSaved(saved);
            alert(newSavedState ? "Failed to save quest" : "Failed to unsave quest");
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // save/unsaveボタンがクリックされた場合は詳細ページに遷移しない
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        // 現在のページ情報を保持して詳細ページに遷移
        const currentPage = searchParams.get("page") || "1";
        const params = new URLSearchParams();
        if (currentPage !== "1") {
            params.set("page", currentPage);
        }

        const returnUrl = params.toString() ? `/?${params.toString()}` : "/";
        router.push(`/quests/${quest.id}?returnTo=${encodeURIComponent(returnUrl)}`);
    };

    return (
        <div
            className="relative rounded-lg overflow-hidden shadow-md cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="relative w-full h-[200px]">
                <Image
                    src={quest.imgUrl}
                    alt={quest.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority={false}
                    loading="lazy"
                />
                <button
                    onClick={handleSaveToggle}
                    disabled={loading}
                    className={`absolute top-2 right-2 text-2xl transition-colors duration-200 ${saved ? "text-yellow-400" : "text-white"
                        } ${loading ? "opacity-50 cursor-not-allowed" : "hover:text-yellow-300"}`}
                    aria-label={saved ? "Unsave quest" : "Save quest"}
                >
                    {saved ? "★" : "☆"}
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-[#ff5757] text-white p-3">
                <p className="line-clamp-2 font-bold">{quest.title}</p>
            </div>
        </div>
    );
} 