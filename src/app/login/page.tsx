"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/profile';

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* 背景イメージ */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-black opacity-70">
                    <Image
                        src="/images/login-bg.png"
                        alt="Tokyo city collage"
                        fill
                        className="object-cover"
                        priority
                    />
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
                        <Image
                            src="/images/tokyoquest_logo.png"
                            alt="Tokyo QUEST Logo"
                            width={400}
                            height={120}
                        />
                    </div>
                </div>

                {/* Google サインインボタン */}
                <div className="w-full max-w-xs">
                    <button
                        onClick={() =>
                            signIn("google", {
                                callbackUrl: callbackUrl,
                            })
                        }
                        className="flex items-center justify-center w-full py-3 px-4 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition shadow-lg"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
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
                        <span className="ml-3 text-lg font-medium">
                            Continue with Google
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
