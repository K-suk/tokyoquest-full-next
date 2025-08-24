// src/components/LogoutButton.tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function LogoutButton() {
    const { data: session } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            // セキュリティログを送信
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: session?.user?.email,
                    reason: "user_logout",
                }),
            });

            // ログアウト実行
            await signOut({
                callbackUrl: "/login",
                redirect: true
            });
        } catch (error) {
            console.error("Logout error:", error);
            // エラーが発生してもログアウトは実行
            await signOut({
                callbackUrl: "/login",
                redirect: true
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`text-white hover:opacity-80 transition-opacity duration-200 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
    );
}
