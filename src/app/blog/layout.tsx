import type { ReactNode } from "react";

export const metadata = {
    title: 'Blog - TokyoQuest',
    description: 'Tokyo探索のヒント、体験談、インサイトを発見しよう。TokyoQuestブログで東京の魅力を深く知る。',
    keywords: ['東京', 'Tokyo', 'ブログ', 'Blog', '旅行', 'Travel', '観光', 'Tourism', 'Tips'],
    robots: 'index, follow',
    openGraph: {
        title: 'Blog - TokyoQuest',
        description: 'Tokyo探索のヒント、体験談、インサイトを発見しよう',
        url: 'https://www.tokyoquest.jp/blog',
        siteName: 'TokyoQuest',
        type: 'website',
    },
};

export default function BlogLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
