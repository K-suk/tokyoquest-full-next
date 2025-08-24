"use client";

import React, { useEffect } from 'react';

interface SafeJsonLdProps {
    data: object;
    id?: string;
}

/**
 * 安全なJSON-LDコンポーネント
 * dangerouslySetInnerHTMLを一切使用せず、DOM操作で安全に挿入
 */
export default function SafeJsonLd({ data, id }: SafeJsonLdProps) {
    useEffect(() => {
        // データが空または無効な場合は何もしない
        if (!data || Object.keys(data).length === 0) {
            return;
        }

        // 既存のスクリプトタグがあれば削除
        if (id) {
            const existingScript = document.getElementById(id);
            if (existingScript) {
                existingScript.remove();
            }
        }

        // 新しいscriptタグを作成
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        if (id) {
            script.id = id;
        }

        // JSON文字列化してtextContentに安全に設定
        try {
            script.textContent = JSON.stringify(data);
            document.head.appendChild(script);
        } catch (error) {
            console.error('Failed to create JSON-LD script:', error);
        }

        // クリーンアップ関数
        return () => {
            if (id) {
                const scriptToRemove = document.getElementById(id);
                if (scriptToRemove) {
                    scriptToRemove.remove();
                }
            }
        };
    }, [data, id]);

    // このコンポーネントは何もレンダリングしない
    return null;
}
