"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
    useEffect(() => {
        try {
            // テーマ設定の初期化
            const theme = localStorage.getItem('theme') || 'light';
            document.documentElement.className = theme;
            document.body.className = theme;
        } catch (e) {
            console.warn('Theme initialization failed:', e);
        }
    }, []);

    return null; // このコンポーネントは何もレンダリングしない
}
