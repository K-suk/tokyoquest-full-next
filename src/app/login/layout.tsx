import type { ReactNode } from "react";

// セキュリティヘッダー
export const metadata = {
    title: 'ログイン - Tokyo QUEST',
    description: 'Tokyo QUESTにログインして、東京の無限のクエストを体験しましょう',
    robots: 'noindex, nofollow', // ログインページはインデックスしない
};

export default function LoginLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="login-page">
            {children}
        </div>
    );
} 