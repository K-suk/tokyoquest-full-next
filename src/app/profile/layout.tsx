import type { ReactNode } from "react";

export const metadata = {
    title: 'Profile - TokyoQuest',
    description: 'あなたのTokyoQuest冒険の記録を確認しよう。完了したクエスト、獲得した経験値、レベルをチェック。',
    keywords: ['プロフィール', 'Profile', 'レベル', 'Level', '経験値', 'Experience', '完了', 'Completed'],
    robots: 'noindex, nofollow', // 個人のプロフィールなのでインデックスしない
};

export default function ProfileLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
