// セキュリティヘッダー
export const metadata = {
    title: 'Admin Panel - TokyoQuest',
    description: 'TokyoQuest管理パネル - クエスト、ブログ、タグの管理',
    robots: 'noindex, nofollow', // 管理者ページはインデックスしない
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100">
            {children}
        </div>
    );
} 