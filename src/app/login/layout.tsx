import { Providers } from "@/components/Providers";
import type { ReactNode } from "react";

// セキュリティヘッダー
export const metadata = {
    title: 'ログイン - Tokyo QUEST',
    description: 'Tokyo QUESTにログインして、東京の無限のクエストを体験しましょう',
    robots: 'noindex, nofollow', // ログインページはインデックスしない
};

// セキュリティヘッダー

export default function LoginLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="ja">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="noindex, nofollow" />
                <meta name="referrer" content="strict-origin-when-cross-origin" />
            </head>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
} 