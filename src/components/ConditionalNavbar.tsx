'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // ナビバーを非表示にするページ
    const hideNavbarPaths = ['/', '/login', '/privacy', '/term'];

    // 指定されたページではヘッダーを表示しない
    if (hideNavbarPaths.includes(pathname)) {
        return null;
    }

    return <Navbar />;
} 