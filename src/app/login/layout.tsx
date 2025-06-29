import { Providers } from "@/components/Providers";
import type { ReactNode } from "react";

// セキュリティヘッダー
export const metadata = {
    title: 'ログイン - Tokyo QUEST',
    description: 'Tokyo QUESTにログインして、東京の無限のクエストを体験しましょう',
    robots: 'noindex, nofollow', // ログインページはインデックスしない
};

// セキュリティヘッダー
export const headers = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

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