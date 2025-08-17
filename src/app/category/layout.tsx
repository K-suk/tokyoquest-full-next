import type { ReactNode } from "react";

export const metadata = {
    title: 'Categories - TokyoQuest',
    description: '東京の様々なエリアやテーマ別のクエストカテゴリを探索しよう。渋谷、新宿、浅草など、東京の魅力的なスポットでクエストを発見。',
    keywords: ['東京', 'Tokyo', 'カテゴリ', 'Categories', 'エリア', 'Areas', '渋谷', 'Shibuya', '新宿', 'Shinjuku', '浅草', 'Asakusa'],
    robots: 'index, follow',
    openGraph: {
        title: 'Categories - TokyoQuest',
        description: '東京の様々なエリアやテーマ別のクエストカテゴリを探索しよう',
        url: 'https://www.tokyoquest.jp/category',
        siteName: 'TokyoQuest',
        type: 'website',
    },
};

export default function CategoryLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
