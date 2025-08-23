// src/app/layout.tsx
import "./globals.css";
import { Providers } from "@/components/Providers";
import type { ReactNode } from "react";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { headers } from "next/headers";

export const metadata = {
  title: 'TokyoQuest',
  description: 'Explore Tokyo like a video game! Complete quests and capture your memories as videos.',
  keywords: ['TokyoQuest', 'Tokyo', 'Quest', 'Sightseeing'],
  robots: 'index, follow', // デフォルトでインデックスを許可
  openGraph: {
    title: 'TokyoQuest',
    description: 'Explore Tokyo like a video game!',
    url: 'https://www.tokyoquest.jp',
    siteName: 'TokyoQuest',
    images: [
      {
        url: 'https://www.tokyoquest.jp/images/tokyoquest_logo.png',
        width: 1200,
        height: 630,
        alt: 'TokyoQuest OG Image',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  // タブアイコン
  icons: {
    icon: [{ url: '/images/tokyoquest_icon.png', type: 'image/png', sizes: '192x192' },],           // 標準の favicon
    shortcut: '/images/tokyoquest_icon.png',        // Windows のショートカット用
    apple: '/images/tokyoquest_icon.png',   // iOS ホーム画面用
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // middlewareで設定されたnonceを取得
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang="ja" suppressHydrationWarning className="light">
      <head>
        {/* インラインスクリプトにnonceを適用（必要な場合） */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // テーマ設定などの最小限のインラインスクリプト
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.className = theme;
                document.body.className = theme;
              } catch (e) {
                console.warn('Theme initialization failed:', e);
              }
            `
          }}
        />
        {/* インラインスタイルにnonceを適用（必要な場合） */}
        <style
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              /* クリティカルCSSなどの最小限のインラインスタイル */
              .loading { opacity: 0.7; }
            `
          }}
        />
      </head>
      <body className="light">
        <Providers>
          <ConditionalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
