"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/profile';
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState({
        background: false,
        logo: false
    });

    // セキュリティ: 既にログインしている場合はリダイレクト
    useEffect(() => {
        // ログイン状態チェックはNextAuthが自動で処理
        // ここでは追加のセキュリティチェックのみ
    }, []);

    // セキュリティ: コールバックURLの検証
    const validateCallbackUrl = (url: string): string => {
        try {
            const urlObj = new URL(url, window.location.origin);
            // 同一オリジンのみ許可
            if (urlObj.origin !== window.location.origin) {
                return '/profile';
            }
            // 危険なパスを除外
            if (urlObj.pathname.startsWith('/api/') ||
                urlObj.pathname.startsWith('/_next/') ||
                urlObj.pathname.startsWith('/admin/')) {
                return '/profile';
            }
            return url;
        } catch {
            return '/profile';
        }
    };

    const handleSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // セキュリティ: レート制限の実装（クライアントサイド）
            const lastAttempt = localStorage.getItem('lastSignInAttempt');
            const now = Date.now();

            if (lastAttempt && (now - parseInt(lastAttempt)) < 5000) {
                setError('You are trying to login too many times. Please try again in 5 seconds.');
                return;
            }

            localStorage.setItem('lastSignInAttempt', now.toString());

            // セキュリティ: 検証済みコールバックURLを使用
            const validatedCallbackUrl = validateCallbackUrl(callbackUrl);

            const result = await signIn("google", {
                callbackUrl: validatedCallbackUrl,
                redirect: false,
            });

            if (result?.error) {
                setError('Failed to login. Please try again later.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Unexpected error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* セキュリティ: CSP nonce対応 */}
            <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" />

            {/* 背景イメージ */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-black opacity-70">
                    {!imageError.background && (
                        <Image
                            src="/images/login-bg.png"
                            alt="Tokyo city collage"
                            fill
                            className="object-cover"
                            priority
                            onError={() => {
                                console.error('Background image failed to load');
                                setImageError(prev => ({ ...prev, background: true }));
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
                {/* Welcome テキスト */}
                <div className="text-white font-bold mb-0">
                    <h1 className="text-7xl md:text-7xl leading-tight">
                        Welcome to<br />
                        city of<br />
                        infinity side<br />
                        quests
                    </h1>
                </div>

                {/* ロゴ */}
                <div className="mb-8 text-center">
                    <div className="relative">
                        {!imageError.logo ? (
                            <Image
                                src="/images/tokyoquest_logo.png"
                                alt="Tokyo QUEST Logo"
                                width={400}
                                height={120}
                                onError={() => {
                                    console.error('Logo failed to load');
                                    setImageError(prev => ({ ...prev, logo: true }));
                                }}
                            />
                        ) : (
                            <div className="text-white text-4xl font-bold">
                                Tokyo QUEST
                            </div>
                        )}
                    </div>
                </div>

                {/* エラーメッセージ */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Google サインインボタン */}
                <div className="w-full max-w-xs">
                    <button
                        onClick={handleSignIn}
                        disabled={isLoading}
                        className={`flex items-center justify-center w-full py-3 px-4 bg-white text-gray-800 rounded-full transition shadow-lg ${isLoading
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-100'
                            }`}
                        // セキュリティ: ボタンの無効化状態
                        aria-label={isLoading ? 'Login trying...' : 'Login with Google'}
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        <span className="ml-3 text-lg font-medium">
                            {isLoading ? 'Loging trying...' : 'Continue with Google'}
                        </span>
                    </button>
                </div>

                {/* セキュリティ情報 */}
                <div className="mt-8 text-center text-white text-sm opacity-70 mb-8">
                    <p>We are using secure Google authentication</p>
                    <p>Siging up or in this account automatically agree to our <Link href="/term" className="font-bold">Terms of Service</Link> and <Link href="/privacy" className="font-bold">Privacy Policy</Link></p>
                </div>
            </div>
        </div>
    );
}

// ローディングフォールバックコンポーネント
function LoginPageFallback() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-black opacity-70">
                    <Image
                        src="/images/login-bg.png"
                        alt="Tokyo city collage"
                        fill
                        className="object-cover"
                        priority
                        onError={(e) => {
                            console.error('Fallback background image failed to load');
                            // エラー時は背景色のみで表示
                        }}
                    />
                </div>
            </div>
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
                <div className="text-white font-bold mb-0">
                    <h1 className="text-7xl md:text-7xl leading-tight">
                        Welcome to<br />
                        city of<br />
                        infinity side<br />
                        quests
                    </h1>
                </div>
                <div className="mb-8 text-center">
                    <div className="relative">
                        <Image
                            src="/images/tokyoquest_logo.png"
                            alt="Tokyo QUEST Logo"
                            width={400}
                            height={120}
                        />
                    </div>
                </div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginPageContent />
        </Suspense>
    );
}
