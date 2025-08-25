import crypto from 'crypto';
import { v4 } from 'uuid';

type CSPConfig = {
  csp: string;
  nonce: string;
};

const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Strict CSPアプローチでnonceを生成し、CSPポリシーを設定します
 * @see https://csp.withgoogle.com/docs/strict-csp.html
 */
export const generateCSP = (): CSPConfig => {
  const hash = crypto.createHash('sha256');
  hash.update(v4());
  const nonce = hash.digest('base64');

  /**
   * Strict CSPを適用します
   * - nonce によるスクリプト実行制御
   * - strict-dynamic で動的に挿入されるスクリプトも許可
   * - unsafe-inline は使用しない（セキュリティのため）
   */
  let csp: string;

  if (isVercelPreview) {
    // Vercelプレビュー環境用の設定
    csp = `
      script-src 'unsafe-eval' 'unsafe-inline' https: http: https://vercel.live/ https://vercel.com https://accounts.google.com https://www.gstatic.com https://www.google.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.vercel.com https://*.gstatic.com;
      object-src 'none';
      base-uri 'none';
      connect-src 'self' https://vercel.live/ https://vercel.com https://*.pusher.com/ wss://*.pusher.com/ https://accounts.google.com https://www.googleapis.com;
      img-src 'self' https://vercel.live/ https://*.vercel.com https://vercel.com https://*.pusher.com/ data: blob: https://lh3.googleusercontent.com https://www.google.com;
      font-src 'self' https://*.vercel.com https://*.gstatic.com https://fonts.gstatic.com;
      frame-src 'self' https://vercel.live/ https://vercel.com https://accounts.google.com;
      form-action 'self' https://accounts.google.com;
      frame-ancestors 'none';
    `
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else {
    // 本番・開発環境用のStrict CSP
    csp = `
      default-src 'self';
      script-src 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com https://www.gstatic.com https://www.google.com https://cdn.jsdelivr.net;
      style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
      img-src 'self' data: https: https://lh3.googleusercontent.com https://www.google.com https://picsum.photos https://images.unsplash.com https://unsplash.com https://plus.unsplash.com https://photos.app.goo.gl https://photos.fife.usercontent.google.com https://*.supabase.co;
      font-src 'self' https: data: https://fonts.gstatic.com;
      connect-src 'self' https: wss: https://accounts.google.com https://www.googleapis.com;
      frame-src 'self' https://accounts.google.com;
      form-action 'self' https://accounts.google.com;
      object-src 'none';
      base-uri 'self';
      frame-ancestors 'none';
      ${isProduction ? 'upgrade-insecure-requests;' : ''}
    `
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return {
    csp,
    nonce,
  };
};

/**
 * App Routerでnonceを取得するためのヘルパー関数
 */
export const getNonceFromHeaders = (): string | null => {
  if (typeof window !== 'undefined') {
    // クライアントサイドでは、metaタグからnonceを取得
    const metaTag = document.querySelector('meta[name="csp-nonce"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  }
  return null;
};
