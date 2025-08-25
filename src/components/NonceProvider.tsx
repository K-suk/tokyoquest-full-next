'use client';

import { createContext, useContext, ReactNode } from 'react';

interface NonceContextType {
  nonce: string | null;
}

const NonceContext = createContext<NonceContextType>({ nonce: null });

interface NonceProviderProps {
  children: ReactNode;
  nonce: string;
}

export function NonceProvider({ children, nonce }: NonceProviderProps) {
  return (
    <NonceContext.Provider value={{ nonce }}>
      {children}
    </NonceContext.Provider>
  );
}

export function useNonce(): string | null {
  const context = useContext(NonceContext);
  return context.nonce;
}

/**
 * クライアントサイドでnonceを取得するヘルパー関数
 */
export function getClientNonce(): string | null {
  if (typeof window === 'undefined') return null;
  
  // X-Nonceヘッダーから取得を試行
  const metaTag = document.querySelector('meta[name="csp-nonce"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  return null;
}
