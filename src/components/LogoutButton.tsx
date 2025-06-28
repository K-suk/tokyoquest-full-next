// src/components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-white hover:opacity-80 transition-opacity duration-200"
        >
            Sign Out
        </button>
    );
}
