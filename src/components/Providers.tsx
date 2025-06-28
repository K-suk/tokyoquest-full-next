// src/components/Providers.tsx
"use client";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <>
            {children}
        </>
    );
}
