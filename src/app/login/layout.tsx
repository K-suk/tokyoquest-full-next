import { Providers } from "@/components/Providers";
import type { ReactNode } from "react";

export default function LoginLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Providers>
            {children}
        </Providers>
    );
} 