// src/app/layout.tsx
import "./globals.css";
import { Providers } from "@/components/Providers";
import type { ReactNode } from "react";
import ConditionalNavbar from "@/components/ConditionalNavbar";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning className="light">
      <body className="light">
        <Providers>
          <ConditionalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
